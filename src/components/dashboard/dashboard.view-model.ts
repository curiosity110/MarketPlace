import { ListingStatus } from "@prisma/client";
import type { DashboardListingItem } from "@/components/dashboard-listing-card";

type DashboardCategory = { id: string };

type DashboardListing = {
  id: string;
  title: string;
  status: ListingStatus;
  priceCents: number;
  currency: string;
  categoryId: string;
  updatedAt: Date;
  activeUntil: Date | null;
  category: {
    id: string;
    name: string;
    slug: string | null;
  };
  city: {
    id: string;
    name: string;
  };
  images: { url: string }[];
  sale: { soldAt: Date } | null;
};

type DashboardAnalyticsData = [DashboardListing[], DashboardCategory[], number];

export type DashboardViewModel = {
  allListingsForClient: DashboardListingItem[];
  allListingsCount: number;
  activeListingsCount: number;
  soldListingsCount: number;
  draftCount: number;
  hasPublishedListing: boolean;
  hasActiveSubscription: boolean;
  requiresPaymentForCreate: boolean;
  selectedCategoryIdFromQuery?: string;
};

export function buildDashboardViewModel(
  analyticsData: DashboardAnalyticsData,
  categoryFromQuery?: string,
): DashboardViewModel {
  // Pure data shaping for dashboard UI; no navigation, auth, or side effects.
  const [allListings, categories, publishedCount] = analyticsData;
  const hasPublishedListing = publishedCount > 0;

  const activeListings = allListings.filter(
    (listing) => listing.status === ListingStatus.ACTIVE && !listing.sale,
  );
  const soldListings = allListings.filter((listing) => Boolean(listing.sale));
  const draftCount = allListings.filter(
    (listing) => listing.status === ListingStatus.DRAFT && !listing.sale,
  ).length;
  const hasActiveSubscription = activeListings.some(
    (listing) => listing.activeUntil === null,
  );

  const validCategoryIds = new Set(categories.map((category) => category.id));
  const selectedCategoryIdFromQuery =
    categoryFromQuery && categoryFromQuery !== "all" && validCategoryIds.has(categoryFromQuery)
      ? categoryFromQuery
      : undefined;

  const allListingsForClient: DashboardListingItem[] = allListings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    status: listing.status,
    priceCents: listing.priceCents,
    currency: listing.currency,
    categoryId: listing.categoryId,
    updatedAt: listing.updatedAt.toISOString(),
    activeUntil: listing.activeUntil ? listing.activeUntil.toISOString() : null,
    category: {
      id: listing.category.id,
      name: listing.category.name,
      slug: listing.category.slug,
    },
    city: {
      id: listing.city.id,
      name: listing.city.name,
    },
    images: listing.images.map((image) => ({ url: image.url })),
    sale: listing.sale?.soldAt
      ? {
          soldAt: listing.sale.soldAt.toISOString(),
        }
      : null,
  }));

  return {
    allListingsForClient,
    allListingsCount: allListings.length,
    activeListingsCount: activeListings.length,
    soldListingsCount: soldListings.length,
    draftCount,
    hasPublishedListing,
    hasActiveSubscription,
    requiresPaymentForCreate: hasPublishedListing && !hasActiveSubscription,
    selectedCategoryIdFromQuery,
  };
}
