"use server";

import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { listingCardSelect } from "@/lib/listing-card-select";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

type ActionLocale = "en" | "mk";

function resolveLocale(raw: string | undefined): ActionLocale {
  return raw === "mk" ? "mk" : "en";
}

function getMessages(locale: ActionLocale) {
  if (locale === "mk") {
    return {
      dbUnavailable: "Базата е привремено недостапна.",
      loginRequired: "Најави се за да зачуваш омилени.",
      notFound: "Огласот не е пронајден.",
      added: "Додадено во омилени.",
      removed: "Отстрането од омилени.",
      listingInfoPrefix: "Оглас",
      categoryPrefix: "Категорија",
    };
  }

  return {
    dbUnavailable: "Database is temporarily unavailable.",
    loginRequired: "Sign in to save favorites.",
    notFound: "Listing not found.",
    added: "Added to favorites.",
    removed: "Removed from favorites.",
    listingInfoPrefix: "Listing",
    categoryPrefix: "Category",
  };
}

export async function toggleFavorite({
  listingId,
  locale,
}: {
  listingId: string;
  locale?: "en" | "mk";
}) {
  const actionLocale = resolveLocale(locale);
  const text = getMessages(actionLocale);
  const user = await getSessionUser();

  if (!user) {
    return {
      ok: false,
      favorited: false,
      requiresLogin: true,
      message: text.loginRequired,
    };
  }

  if (shouldSkipPrismaCalls()) {
    return {
      ok: false,
      favorited: false,
      message: text.dbUnavailable,
    };
  }

  const safeListingId = listingId.trim();
  if (!safeListingId) {
    return {
      ok: false,
      favorited: false,
      message: text.notFound,
    };
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: safeListingId },
      select: {
        id: true,
        title: true,
        category: {
          select: {
            name: true,
            parent: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      return {
        ok: false,
        favorited: false,
        message: text.notFound,
      };
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: safeListingId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      markPrismaHealthy();

      revalidatePath("/");
      revalidatePath("/browse");
      revalidatePath("/profile");
      revalidatePath("/dashboard");
      revalidatePath(`/listing/${safeListingId}`);

      return {
        ok: true,
        favorited: false,
        message: text.removed,
      };
    }

    const categoryLabel = listing.category?.parent?.name
      ? `${listing.category.parent.name} / ${listing.category.name}`
      : listing.category?.name || "";
    const body = `${text.listingInfoPrefix}: ${listing.title}${
      categoryLabel ? ` • ${text.categoryPrefix}: ${categoryLabel}` : ""
    }`;

    await prisma.$transaction([
      prisma.favorite.create({
        data: {
          userId: user.id,
          listingId: safeListingId,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          title: text.added,
          body,
          href: `/listing/${safeListingId}`,
        },
      }),
    ]);
    markPrismaHealthy();

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/notifications");
    revalidatePath(`/listing/${safeListingId}`);

    return {
      ok: true,
      favorited: true,
      message: text.added,
    };
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return {
        ok: false,
        favorited: false,
        message: text.dbUnavailable,
      };
    }
    throw error;
  }
}

export async function listFavorites(options?: { limit?: number }) {
  const user = await getSessionUser();
  if (!user || shouldSkipPrismaCalls()) return [];

  try {
    const rows = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      select: {
        id: true,
        createdAt: true,
        listing: {
          select: listingCardSelect,
        },
      },
    });
    markPrismaHealthy();
    return rows;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return [];
    }
    throw error;
  }
}

export async function isFavorited(listingId: string) {
  const user = await getSessionUser();
  if (!user || shouldSkipPrismaCalls()) return false;

  const safeListingId = listingId.trim();
  if (!safeListingId) return false;

  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: safeListingId,
        },
      },
      select: { id: true },
    });
    markPrismaHealthy();
    return Boolean(favorite);
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return false;
    }
    throw error;
  }
}
