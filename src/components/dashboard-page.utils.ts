import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

export type DashboardListingView = "all" | "active" | "draft" | "expired" | "sold";
export type DashboardListingSort = "newest" | "price-asc" | "price-desc";
export type DashboardListingLayout = "grid" | "list";

export function parseDashboardView(value: string | undefined): DashboardListingView {
  if (value === "active" || value === "draft" || value === "expired" || value === "sold") {
    return value;
  }
  return "all";
}

export function parseDashboardSort(value: string | undefined): DashboardListingSort {
  if (value === "price-asc" || value === "price-desc") return value;
  return "newest";
}

export function parseDashboardLayout(value: string | undefined): DashboardListingLayout {
  if (value === "list") return "list";
  return "grid";
}

async function queryDashboardAnalytics(ownerAuthUserId: string) {
  return Promise.all([
    prisma.listing.findMany({
      where: { ownerId: ownerAuthUserId },
      include: {
        category: true,
        city: true,
        images: true,
        sale: {
          select: {
            id: true,
            soldAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.listing.count({
      where: {
        ownerId: ownerAuthUserId,
        status: { not: ListingStatus.DRAFT },
      },
    }),
  ]);
}

export async function fetchDashboardAnalyticsData(ownerAuthUserId: string) {
  let analyticsData: Awaited<ReturnType<typeof queryDashboardAnalytics>> | null =
    null;
  try {
    if (!shouldSkipPrismaCalls()) {
      analyticsData = await queryDashboardAnalytics(ownerAuthUserId);
      markPrismaHealthy();
    }
  } catch (dbError) {
    if (isPrismaConnectionError(dbError)) {
      markPrismaUnavailable();
      return null;
    }
    throw dbError;
  }
  return analyticsData;
}
