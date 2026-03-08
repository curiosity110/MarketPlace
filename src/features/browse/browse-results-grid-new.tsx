import type { listingCardSelect } from "@/lib/listing-card-select";
import { BrowseCard } from "@/features/browse/browse-card";
import type { Prisma } from "@prisma/client";

type BrowseResultsGridProps = {
  listings: Array<Prisma.ListingGetPayload<typeof listingCardSelect>>;
  locale: "en" | "mk";
  currentAuthUserId?: string | null;
  favoriteListingIdSet: Set<string>;
  browseQuery: string;
};

export function BrowseResultsGrid({
  listings,
  locale,
  currentAuthUserId,
  favoriteListingIdSet,
  browseQuery,
}: BrowseResultsGridProps) {
  return (
    <div className="grid min-w-0 auto-rows-max grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <BrowseCard
          key={listing.id}
          listing={listing}
          locale={locale}
          currentAuthUserId={currentAuthUserId}
          isFavorited={favoriteListingIdSet.has(listing.id)}
          browseQuery={browseQuery}
        />
      ))}
    </div>
  );
}
