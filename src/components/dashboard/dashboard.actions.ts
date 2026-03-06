import { ListingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { markPrismaHealthy, markPrismaUnavailable, shouldSkipPrismaCalls } from "@/lib/prisma-circuit-breaker";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function createPublishDraftFromDashboardAction(isMk: boolean) {
  return async function publishDraftFromDashboard(formData: FormData) {
    "use server";

    const msg = isMk
      ? {
          dbUnavailable: "Базата е привремено недостапна",
          invalidListing: "Невалиден оглас.",
          draftNotFound: "Нацртот не е пронајден.",
          phoneRequired: "Телефонски број е задолжителен за објава.",
          titleRequired: "Наслов е задолжителен за објава.",
          priceRequired: "Цената мора да биде поголема од 0.",
          categoryRequired: "Категорија е задолжителна за објава.",
          cityRequired: "Град е задолжителен за објава.",
          paymentRequired: "Потребно е Dummy Stripe плаќање пред активација.",
          categoryInvalid: "Избраната категорија е невалидна.",
          cityInvalid: "Избраниот град е невалиден.",
        }
      : {
          dbUnavailable: "Database is temporarily unreachable",
          invalidListing: "Invalid listing.",
          draftNotFound: "Draft listing not found.",
          phoneRequired: "Phone number is required to publish.",
          titleRequired: "Title is required to publish.",
          priceRequired: "Price must be greater than 0.",
          categoryRequired: "Category is required to publish.",
          cityRequired: "City is required to publish.",
          paymentRequired: "Dummy Stripe payment is required before activation.",
          categoryInvalid: "Selected category is invalid.",
          cityInvalid: "Selected city is invalid.",
        };

    const sessionUser = await requireSeller();
    if (shouldSkipPrismaCalls()) {
      redirect(`/dashboard?error=${encodeURIComponent(msg.dbUnavailable)}`);
    }

    const listingId = String(formData.get("id") || "");
    if (!listingId) {
      redirect(`/dashboard?error=${encodeURIComponent(msg.invalidListing)}`);
    }

    try {
      const [draftListing, profile] = await Promise.all([
        prisma.listing.findFirst({
          where: { id: listingId, ownerId: sessionUser.authUserId },
          select: {
            id: true,
            ownerId: true,
            status: true,
            title: true,
            priceCents: true,
            categoryId: true,
            cityId: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: sessionUser.id },
          select: { phone: true },
        }),
      ]);

      if (
        !draftListing ||
        draftListing.ownerId !== sessionUser.authUserId ||
        draftListing.status !== ListingStatus.DRAFT
      ) {
        redirect(`/dashboard?error=${encodeURIComponent(msg.draftNotFound)}`);
      }

      if (!profile?.phone?.trim()) {
        redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(msg.phoneRequired)}`);
      }

      if (!draftListing.title.trim()) {
        redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(msg.titleRequired)}`);
      }
      if (draftListing.priceCents <= 0) {
        redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(msg.priceRequired)}`);
      }
      if (!draftListing.categoryId) {
        redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(msg.categoryRequired)}`);
      }
      if (!draftListing.cityId) {
        redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(msg.cityRequired)}`);
      }

      const [priorPublishedPosts, categoryExists, cityExists, activeSubscriptionCount] =
        await Promise.all([
          prisma.listing.count({
            where: {
              ownerId: sessionUser.authUserId,
              id: { not: listingId },
              status: { not: ListingStatus.DRAFT },
            },
          }),
          prisma.category.count({
            where: { id: draftListing.categoryId, isActive: true },
          }),
          prisma.city.count({
            where: { id: draftListing.cityId },
          }),
          prisma.listing.count({
            where: {
              ownerId: sessionUser.authUserId,
              status: ListingStatus.ACTIVE,
              activeUntil: null,
              sale: null,
            },
          }),
        ]);
      const hasSubscriptionAccess = activeSubscriptionCount > 0;

      if (priorPublishedPosts > 0 && !hasSubscriptionAccess) {
        redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(msg.paymentRequired)}`);
      }

      if (categoryExists === 0) {
        redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(msg.categoryInvalid)}`);
      }
      if (cityExists === 0) {
        redirect(`/sell/${listingId}/edit?error=${encodeURIComponent(msg.cityInvalid)}`);
      }

      await prisma.listing.updateMany({
        where: { id: listingId, ownerId: sessionUser.authUserId },
        data: {
          status: ListingStatus.ACTIVE,
          activeUntil: hasSubscriptionAccess ? null : new Date(Date.now() + THIRTY_DAYS_MS),
        },
      });

      markPrismaHealthy();
    } catch (dbError) {
      if (isPrismaConnectionError(dbError)) {
        markPrismaUnavailable();
        redirect(`/dashboard?error=${encodeURIComponent(msg.dbUnavailable)}`);
      }
      throw dbError;
    }

    revalidatePath("/browse");
    revalidatePath("/sell");
    revalidatePath("/dashboard");
    revalidatePath(`/listing/${listingId}`);
    redirect("/dashboard?free=1");
  };
}
