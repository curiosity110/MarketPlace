import { unstable_cache } from "next/cache";
import { ListingStatus } from "@prisma/client";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { getSessionUser } from "@/lib/auth";
import { buildCreateListingHref } from "@/lib/create-listing-href";
import { getServerLocale } from "@/lib/i18n";
import { listingCardSelect } from "@/lib/listing-card-select";
import {
  getHomePageContent,
  HomeCtaSection,
  HomeHeroSection,
  HomeLatestListingsSection,
  HomeTrustSection,
  type HomeCategoryHighlight,
} from "@/components/home";

const getCachedHomeLatestListings = unstable_cache(
  async () =>
    prisma.listing.findMany({
      where: { status: ListingStatus.ACTIVE, sale: null },
      ...listingCardSelect,
      orderBy: { createdAt: "desc" },
      take: 9,
    }),
  ["home-latest-listings-v1"],
  { revalidate: 30 },
);

export default async function Home() {
  // Home page container: fetches data + localized content, renders modular sections.
  const locale = await getServerLocale();
  const sessionUser = await getSessionUser();
  const createHref = buildCreateListingHref();
  const createPayPerHref = buildCreateListingHref({
    plan: "pay-per-listing",
  });
  const createSubscriptionHref = buildCreateListingHref({
    plan: "subscription",
  });
  const { text, pricingPlans, quickTitle, quickItems } = getHomePageContent(
    locale,
    createPayPerHref,
    createSubscriptionHref,
  );

  async function fetchHomeData() {
    return Promise.all([
      getCachedHomeLatestListings(),
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { listings: true } },
        },
        orderBy: { listings: { _count: "desc" } },
        take: 6,
      }),
    ]);
  }

  let latestListings: Awaited<ReturnType<typeof fetchHomeData>>[0] = [];
  let categoryHighlights: HomeCategoryHighlight[] = [];
  const favoriteListingIdSet = new Set<string>();
  let dbUnavailable = false;

  try {
    if (!shouldSkipPrismaCalls()) {
      [latestListings, categoryHighlights] = await fetchHomeData();
      if (sessionUser && latestListings.length > 0) {
        const favoriteRows = await prisma.favorite.findMany({
          where: {
            userId: sessionUser.id,
            listingId: { in: latestListings.map((listing) => listing.id) },
          },
          select: { listingId: true },
        });
        favoriteRows.forEach((favorite) =>
          favoriteListingIdSet.add(favorite.listingId),
        );
      }
      markPrismaHealthy();
    } else {
      dbUnavailable = true;
    }
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      dbUnavailable = true;
    } else {
      throw error;
    }
  }

  return (
    <div className="max-w-full min-w-0 space-y-12 overflow-x-hidden md:space-y-16">
      <HomeHeroSection
        locale={locale}
        text={text}
        createHref={createHref}
        categoryHighlights={categoryHighlights}
      />
      <HomeTrustSection
        quickTitle={quickTitle}
        browseAllLabel={text.browseAll}
        quickItems={quickItems}
        dbUnavailable={dbUnavailable}
        dbUnavailableLabel={text.dbUnavailable}
      />
      <HomeLatestListingsSection
        locale={locale}
        text={text}
        createHref={createHref}
        latestListings={latestListings}
        currentAuthUserId={sessionUser?.authUserId}
        favoriteListingIdSet={favoriteListingIdSet}
      />
      <HomeCtaSection text={text} pricingPlans={pricingPlans} />
    </div>
  );
}

