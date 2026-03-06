import { Currency, ListingStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import {
  getDynamicFieldEntries,
  statusFromIntent,
  validatePublishInputs,
} from "@/lib/listing-fields";
import {
  buildRateLimitKey,
  consumeRateLimit,
  getIpHashFromServerActionHeaders,
  RateLimitExceededError,
} from "@/lib/rate-limit";
import { isMarketplaceCurrency } from "@/lib/currency";
import { normalizePhoneInput } from "@/lib/phone";
import { validateDummyStripePayment } from "@/lib/billing/dummy-stripe";
import { getSupabaseAdminStorageContext } from "@/lib/supabase/admin";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_TOTAL_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_IMAGES_PER_LISTING = 10;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_DEFAULT_DELIVERY_TEXT_LENGTH = 600;

type ActionLocale = "en" | "mk";
type CreateErrorField =
  | "title"
  | "categoryId"
  | "cityId"
  | "price"
  | "phone"
  | "general";

export type CreateListingResult =
  | { ok: true; listingId: string; status: "ACTIVE" | "DRAFT"; message?: string }
  | {
      ok: false;
      error: string;
      field?: CreateErrorField;
      listingId?: string;
      needsEdit?: boolean;
    };

function resolveActionLocale(value: FormDataEntryValue | null): ActionLocale {
  return value === "mk" ? "mk" : "en";
}

function getActionMessages(locale: ActionLocale) {
  if (locale === "mk") {
    return {
      dbUnavailable: "Базата е привремено недостапна",
      onlyEurMkd: "Дозволени се само EUR и MKD.",
      phoneRequired: "Телефонски број е задолжителен за објава.",
      categoryRequired: "Категорија е задолжителна за објава.",
      cityRequired: "Град е задолжителен за објава.",
      categoryInvalid: "Избраната категорија е невалидна.",
      cityInvalid: "Избраниот град е невалиден.",
      paymentRequired:
        "Потребно е плаќање пред активација. Нацртот е зачуван за да платиш и објавиш од уредување.",
      draftSaveFailed: "Зачувувањето на нацрт не успеа",
      tooManyRequests: "\u041f\u0440\u0435\u043c\u043d\u043e\u0433\u0443 \u043e\u0431\u0438\u0434\u0438 \u0434\u0435\u043d\u0435\u0441.",
    };
  }

  return {
    dbUnavailable: "Database is temporarily unreachable",
    onlyEurMkd: "Only EUR and MKD are allowed.",
    phoneRequired: "Phone number is required to publish.",
    categoryRequired: "Category is required to publish.",
    cityRequired: "City is required to publish.",
    categoryInvalid: "Selected category is invalid.",
    cityInvalid: "Selected city is invalid.",
      paymentRequired:
        "Payment is required before activation. Draft saved so you can pay and publish from edit.",
      draftSaveFailed: "Draft save failed",
      draftSaved: "Draft saved.",
      defaultsSaved: "Default seller values were saved.",
      tooManyRequests: "Too many requests today.",
    };
}

function resolveActiveUntil(status: ListingStatus, plan: string) {
  if (status !== ListingStatus.ACTIVE) return null;
  if (plan === "subscription") return null;
  return new Date(Date.now() + THIRTY_DAYS_MS);
}

function inferErrorField(message: string): CreateErrorField {
  if (/(phone|телефон)/i.test(message)) return "phone";
  if (/(title|наслов)/i.test(message)) return "title";
  if (/(price|цена)/i.test(message)) return "price";
  if (/(category|категори)/i.test(message)) return "categoryId";
  if (/(city|град)/i.test(message)) return "cityId";
  return "general";
}

function buildCreateErrorResult(
  message: string,
  field: CreateErrorField = "general",
  options?: {
    listingId?: string;
    needsEdit?: boolean;
  },
): CreateListingResult {
  const resolvedField = field === "general" ? inferErrorField(message) : field;
  const result: Extract<CreateListingResult, { ok: false }> = {
    ok: false,
    error: message,
  };
  if (resolvedField !== "general") {
    result.field = resolvedField;
  }
  if (options?.listingId) {
    result.listingId = options.listingId;
  }
  if (options?.needsEdit) {
    result.needsEdit = true;
  }
  return result;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function getImageFiles(formData: FormData) {
  return formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function uploadListingImages({
  listingId,
  files,
}: {
  listingId: string;
  files: File[];
}) {
  if (files.length === 0) {
    return { ok: true as const };
  }

  if (files.length > MAX_IMAGES_PER_LISTING) {
    return {
      ok: false as const,
      error: `You can upload up to ${MAX_IMAGES_PER_LISTING} images per listing`,
    };
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      return { ok: false as const, error: "Only JPG, PNG, or WEBP images are allowed" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { ok: false as const, error: "Each image must be 4MB or smaller" };
    }
  }

  const totalFileSize = files.reduce((total, file) => total + file.size, 0);
  if (totalFileSize > MAX_TOTAL_FILE_SIZE) {
    return {
      ok: false as const,
      error: "Total image size must be 4MB or less",
    };
  }

  const {
    context: storageContext,
    error: storageConfigError,
  } = getSupabaseAdminStorageContext();
  if (!storageContext) {
    return {
      ok: false as const,
      error: storageConfigError || "Storage auth client is not configured",
    };
  }

  const uploadedUrls: string[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const safeName = sanitizeFileName(file.name);
    const path = `${listingId}/${Date.now()}-${index}-${safeName}`;
    const { error: uploadError } = await storageContext.client.storage
      .from(storageContext.bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return { ok: false as const, error: uploadError.message };
    }

    const { data } = storageContext.client.storage
      .from(storageContext.bucket)
      .getPublicUrl(path);
    uploadedUrls.push(data.publicUrl);
  }

  try {
    await prisma.listingImage.createMany({
      data: uploadedUrls.map((url) => ({ listingId, url })),
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return { ok: false as const, error: "Database is temporarily unreachable" };
    }
    throw error;
  }

  return { ok: true as const };
}

async function createListingWithBase(
  formData: FormData,
): Promise<CreateListingResult> {
  const locale = resolveActionLocale(formData.get("locale"));
  const msg = getActionMessages(locale);
  const user = await requireSeller();
  if (shouldSkipPrismaCalls()) {
    return buildCreateErrorResult(msg.dbUnavailable);
  }

  try {
    const ipHash = await getIpHashFromServerActionHeaders();
    await consumeRateLimit({
      action: "listing:create",
      key: buildRateLimitKey({ userId: user.authUserId, ipHash }),
      limit: 10,
      locale,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return buildCreateErrorResult(msg.tooManyRequests);
    }
    throw error;
  }

  const intent = String(formData.get("intent") || "draft");
  let status = statusFromIntent(intent);
  const plan = String(formData.get("plan") || "pay-per-listing");
  const paymentProvider = String(formData.get("paymentProvider") || "none");
  let isFirstPublishedPost = false;
  let hasActiveSubscription = false;
  let chargedWithDummyPayment = false;
  let paymentDeferredReason: string | null = null;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const cityId = String(formData.get("cityId") || "");
  const currencyRaw = String(formData.get("currency") || Currency.MKD);
  if (!isMarketplaceCurrency(currencyRaw)) {
    return buildCreateErrorResult(msg.onlyEurMkd, "price");
  }
  const currency = currencyRaw;
  const condition = formData.get(
    "condition",
  ) as Prisma.ListingUncheckedCreateInput["condition"];
  const phoneCountry = String(formData.get("phoneCountry") || "MK");
  const phoneRaw = String(formData.get("phone") || "").trim();
  let sellerPhoneToSave: string | null = null;
  if (phoneRaw.length > 0) {
    const normalizedPhoneResult = normalizePhoneInput(phoneRaw, phoneCountry, locale);
    if (!normalizedPhoneResult.ok) {
      return buildCreateErrorResult(normalizedPhoneResult.error, "phone");
    }
    sellerPhoneToSave = normalizedPhoneResult.e164;
  } else if (status === ListingStatus.ACTIVE) {
    return buildCreateErrorResult(msg.phoneRequired, "phone");
  }
  const price = Number(formData.get("price") || 0);
  const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;

  const dynamicValues = getDynamicFieldEntries(formData);
  const imageFiles = getImageFiles(formData);

  if (intent === "save-defaults") {
    if (cityId) {
      try {
        const cityExists = await prisma.city.count({
          where: { id: cityId },
        });
        markPrismaHealthy();
        if (cityExists === 0) {
          return buildCreateErrorResult(msg.cityInvalid, "cityId");
        }
      } catch (error) {
        if (isPrismaConnectionError(error)) {
          markPrismaUnavailable();
          return buildCreateErrorResult(msg.dbUnavailable);
        }
        throw error;
      }
    }

    const defaultDeliveryText = description
      ? description.slice(0, MAX_DEFAULT_DELIVERY_TEXT_LENGTH)
      : null;

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          defaultCountry: phoneCountry || null,
          defaultPhone: sellerPhoneToSave,
          defaultCityId: cityId || null,
          defaultDeliveryText,
          ...(sellerPhoneToSave ? { phone: sellerPhoneToSave } : {}),
        },
      });
      markPrismaHealthy();
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        return buildCreateErrorResult(msg.dbUnavailable);
      }
      throw error;
    }

    revalidatePath("/dashboard");
    return {
      ok: true,
      listingId: "",
      status: "DRAFT",
      message: msg.defaultsSaved,
    };
  }

  if (status === ListingStatus.ACTIVE) {
    if (!categoryId) {
      return buildCreateErrorResult(msg.categoryRequired, "categoryId");
    }
    if (!cityId) {
      return buildCreateErrorResult(msg.cityRequired, "cityId");
    }

    try {
      const [categoryExists, cityExists] = await Promise.all([
        prisma.category.count({
          where: { id: categoryId, isActive: true },
        }),
        prisma.city.count({
          where: { id: cityId },
        }),
      ]);
      markPrismaHealthy();
      if (categoryExists === 0) {
        return buildCreateErrorResult(msg.categoryInvalid, "categoryId");
      }
      if (cityExists === 0) {
        return buildCreateErrorResult(msg.cityInvalid, "cityId");
      }
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        return buildCreateErrorResult(msg.dbUnavailable);
      }
      throw error;
    }

    try {
      const [priorPublishedPosts, activeSubscriptionCount] = await Promise.all([
        prisma.listing.count({
          where: {
            ownerId: user.authUserId,
            status: { not: ListingStatus.DRAFT },
          },
        }),
        prisma.listing.count({
          where: {
            ownerId: user.authUserId,
            status: ListingStatus.ACTIVE,
            activeUntil: null,
            sale: null,
          },
        }),
      ]);
      isFirstPublishedPost = priorPublishedPosts === 0;
      hasActiveSubscription = activeSubscriptionCount > 0;
      markPrismaHealthy();
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        return buildCreateErrorResult(msg.dbUnavailable);
      }
      throw error;
    }
  }

  if (status === ListingStatus.ACTIVE) {
    if (!isFirstPublishedPost && !hasActiveSubscription && paymentProvider !== "stripe-dummy") {
      status = ListingStatus.DRAFT;
      paymentDeferredReason = msg.paymentRequired;
    } else if (!isFirstPublishedPost && !hasActiveSubscription && paymentProvider === "stripe-dummy") {
      const paymentResult = validateDummyStripePayment({
        cardNumberRaw: String(formData.get("dummyCardNumber") || ""),
        cardExpRaw: String(formData.get("dummyCardExp") || ""),
        cardCvcRaw: String(formData.get("dummyCardCvc") || ""),
      });
      if (!paymentResult.ok) {
        status = ListingStatus.DRAFT;
        paymentDeferredReason = paymentResult.error;
      } else {
        chargedWithDummyPayment = true;
      }
    }

    if (status === ListingStatus.ACTIVE) {
      const validation = validatePublishInputs({
        title,
        priceCents,
        locale,
      });
      if (!validation.isValid) {
        return buildCreateErrorResult(validation.errors[0]);
      }
    }
  }

  let listingId = "";
  try {
    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.create({
        data: {
          ownerId: user.authUserId,
          sellerId: user.id,
          title,
          description,
          priceCents,
          currency,
          categoryId,
          cityId,
          condition,
          status,
          activeUntil: resolveActiveUntil(
            status,
            hasActiveSubscription
              ? "subscription"
              : isFirstPublishedPost
                ? "pay-per-listing"
                : plan,
          ),
        },
      });
      if (sellerPhoneToSave) {
        await tx.user.update({
          where: { id: user.id },
          data: { phone: sellerPhoneToSave },
        });
      }

      listingId = listing.id;
      const entries = Object.entries(dynamicValues).filter(
        ([, value]) => value.trim().length > 0,
      );
      if (entries.length > 0) {
        await tx.listingFieldValue.createMany({
          data: entries.map(([key, value]) => ({
            listingId: listing.id,
            key,
            value,
          })),
        });
      }
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return buildCreateErrorResult(msg.dbUnavailable);
    }
    throw error;
  }

  const uploadResult = await uploadListingImages({
    listingId,
    files: imageFiles,
  });
  if (!uploadResult.ok) {
    return buildCreateErrorResult(uploadResult.error, "general", {
      listingId,
      needsEdit: true,
    });
  }

  revalidatePath("/browse");
  revalidatePath("/sell/analytics");
  revalidatePath("/dashboard");
  if (listingId) revalidatePath(`/listing/${listingId}`);

  if (paymentDeferredReason && listingId) {
    return buildCreateErrorResult(paymentDeferredReason, "general", {
      listingId,
      needsEdit: true,
    });
  }

  if (status === ListingStatus.ACTIVE) {
    const message =
      isFirstPublishedPost
        ? undefined
        : !hasActiveSubscription && chargedWithDummyPayment
          ? undefined
          : undefined;
    return { ok: true, listingId, status: "ACTIVE", ...(message ? { message } : {}) };
  }

  if (status === ListingStatus.DRAFT && listingId) {
    return { ok: true, listingId, status: "DRAFT", message: msg.draftSaved };
  }

  return buildCreateErrorResult(msg.draftSaveFailed);
}

export async function createListingFromSell(formData: FormData) {
  "use server";
  return await createListingWithBase(formData);
}

export async function createListingFromAnalytics(formData: FormData) {
  "use server";
  return await createListingWithBase(formData);
}

export async function createListingFromDashboard(formData: FormData) {
  "use server";
  return await createListingWithBase(formData);
}
