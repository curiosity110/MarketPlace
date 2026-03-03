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
const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
const MAX_IMAGES_PER_LISTING = 10;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

type CreateRedirectBase = "/sell" | "/sell/analytics" | "/dashboard";

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
      return { ok: false as const, error: "Each image must be 6MB or smaller" };
    }
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
  const user = await requireSeller();
  if (shouldSkipPrismaCalls()) {
    redirectWithError(basePath, "Database is temporarily unreachable");
  }

  const intent = String(formData.get("intent") || "draft");
  let status = statusFromIntent(intent);
  const plan = String(formData.get("plan") || "pay-per-listing");
  const paymentProvider = String(formData.get("paymentProvider") || "none");
  let isFirstPublishedPost = false;
  let paymentDeferredReason: string | null = null;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const cityId = String(formData.get("cityId") || "");
  const currencyRaw = String(formData.get("currency") || Currency.MKD);
  if (!isMarketplaceCurrency(currencyRaw)) {
    redirectWithError(basePath, "Only EUR and MKD are allowed.");
  }
  const currency = currencyRaw;
  const condition = formData.get(
    "condition",
  ) as Prisma.ListingUncheckedCreateInput["condition"];
  const phoneCountry = String(formData.get("phoneCountry") || "MK");
  const phoneRaw = String(formData.get("phone") || "").trim();
  let sellerPhoneToSave: string | null = null;
  if (phoneRaw.length > 0) {
    const normalizedPhoneResult = normalizePhoneInput(phoneRaw, phoneCountry);
    if (!normalizedPhoneResult.ok) {
      redirectWithError(basePath, normalizedPhoneResult.error);
    }
    sellerPhoneToSave = normalizedPhoneResult.e164;
  } else if (status === ListingStatus.ACTIVE) {
    redirectWithError(basePath, "Phone number is required to publish.");
  }
  const price = Number(formData.get("price") || 0);
  const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;

  const dynamicValues = getDynamicFieldEntries(formData);
  const imageFiles = getImageFiles(formData);

  if (status === ListingStatus.ACTIVE) {
    if (!categoryId) {
      redirectWithError(basePath, "Category is required to publish.");
    }
    if (!cityId) {
      redirectWithError(basePath, "City is required to publish.");
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
        redirectWithError(basePath, "Selected category is invalid.");
      }
      if (cityExists === 0) {
        redirectWithError(basePath, "Selected city is invalid.");
      }
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        redirectWithError(basePath, "Database is temporarily unreachable");
      }
      throw error;
    }

    try {
      const priorPublishedPosts = await prisma.listing.count({
        where: {
          ownerId: user.authUserId,
          status: { not: ListingStatus.DRAFT },
        },
      });
      isFirstPublishedPost = priorPublishedPosts === 0;
      markPrismaHealthy();
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        redirectWithError(basePath, "Database is temporarily unreachable");
      }
      throw error;
    }
  }

  if (status === ListingStatus.ACTIVE) {
    if (!isFirstPublishedPost && paymentProvider !== "stripe-dummy") {
      status = ListingStatus.DRAFT;
      paymentDeferredReason =
        "Payment is required before activation. Draft saved so you can pay and publish from edit.";
    } else if (!isFirstPublishedPost && paymentProvider === "stripe-dummy") {
      const paymentResult = validateDummyStripePayment({
        cardNumberRaw: String(formData.get("dummyCardNumber") || ""),
        cardExpRaw: String(formData.get("dummyCardExp") || ""),
        cardCvcRaw: String(formData.get("dummyCardCvc") || ""),
      });
      if (!paymentResult.ok) {
        status = ListingStatus.DRAFT;
        paymentDeferredReason = paymentResult.error;
      }
    }

    if (status === ListingStatus.ACTIVE) {
      const validation = validatePublishInputs({
        title,
        priceCents,
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
            isFirstPublishedPost ? "pay-per-listing" : plan,
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
      redirectWithError(basePath, "Database is temporarily unreachable");
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
  if (status === ListingStatus.ACTIVE && paymentProvider === "stripe-dummy") {
    redirect(`${basePath}?paid=1`);
  }
  if (status === ListingStatus.DRAFT) {
    if (listingId) {
      if (paymentDeferredReason) {
        redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(paymentDeferredReason)}`);
      }
      redirect(`/sell/${listingId}/edit`);
    }
    redirect(`${basePath}?error=Draft%20save%20failed`);
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
