import { Currency, ListingStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
import { isMarketplaceCurrency } from "@/lib/currency";
import { normalizePhoneInput } from "@/lib/phone";
import { validateDummyStripePayment } from "@/lib/billing/dummy-stripe";
import { getSupabaseAdminStorageContext } from "@/lib/supabase/admin";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_TOTAL_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_IMAGES_PER_LISTING = 10;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

type CreateRedirectBase = "/sell" | "/sell/analytics" | "/dashboard";
type ActionLocale = "en" | "mk";

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
  };
}

function resolveActiveUntil(status: ListingStatus, plan: string) {
  if (status !== ListingStatus.ACTIVE) return null;
  if (plan === "subscription") return null;
  return new Date(Date.now() + THIRTY_DAYS_MS);
}

function redirectWithError(basePath: CreateRedirectBase, message: string): never {
  redirect(`${basePath}?error=${encodeURIComponent(message)}`);
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
  basePath: CreateRedirectBase,
) {
  const locale = resolveActionLocale(formData.get("locale"));
  const msg = getActionMessages(locale);
  const user = await requireSeller();
  if (shouldSkipPrismaCalls()) {
    redirectWithError(basePath, msg.dbUnavailable);
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
    redirectWithError(basePath, msg.onlyEurMkd);
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
      redirectWithError(basePath, normalizedPhoneResult.error);
    }
    sellerPhoneToSave = normalizedPhoneResult.e164;
  } else if (status === ListingStatus.ACTIVE) {
    redirectWithError(basePath, msg.phoneRequired);
  }
  const price = Number(formData.get("price") || 0);
  const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;

  const dynamicValues = getDynamicFieldEntries(formData);
  const imageFiles = getImageFiles(formData);

  if (status === ListingStatus.ACTIVE) {
    if (!categoryId) {
      redirectWithError(basePath, msg.categoryRequired);
    }
    if (!cityId) {
      redirectWithError(basePath, msg.cityRequired);
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
        redirectWithError(basePath, msg.categoryInvalid);
      }
      if (cityExists === 0) {
        redirectWithError(basePath, msg.cityInvalid);
      }
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        redirectWithError(basePath, msg.dbUnavailable);
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
        redirectWithError(basePath, msg.dbUnavailable);
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
        redirectWithError(basePath, validation.errors[0]);
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
      redirectWithError(basePath, msg.dbUnavailable);
    }
    throw error;
  }

  const uploadResult = await uploadListingImages({
    listingId,
    files: imageFiles,
  });
  if (!uploadResult.ok) {
    redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(uploadResult.error)}`);
  }

  revalidatePath("/browse");
  revalidatePath("/sell");
  revalidatePath("/sell/analytics");
  revalidatePath("/dashboard");
  if (listingId) revalidatePath(`/listing/${listingId}`);

  if (status === ListingStatus.ACTIVE && isFirstPublishedPost) {
    redirect(`${basePath}?free=1`);
  }
  if (
    status === ListingStatus.ACTIVE &&
    !isFirstPublishedPost &&
    !hasActiveSubscription &&
    chargedWithDummyPayment
  ) {
    redirect(`${basePath}?paid=1`);
  }
  if (status === ListingStatus.DRAFT) {
    if (listingId) {
      if (paymentDeferredReason) {
        redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(paymentDeferredReason)}`);
      }
      redirect(`/sell/${listingId}/edit`);
    }
    redirect(`${basePath}?error=${encodeURIComponent(msg.draftSaveFailed)}`);
  }

  redirect(basePath);
}

export async function createListingFromSell(formData: FormData) {
  "use server";
  await createListingWithBase(formData, "/sell");
}

export async function createListingFromAnalytics(formData: FormData) {
  "use server";
  await createListingWithBase(formData, "/sell/analytics");
}

export async function createListingFromDashboard(formData: FormData) {
  "use server";
  await createListingWithBase(formData, "/dashboard");
}
