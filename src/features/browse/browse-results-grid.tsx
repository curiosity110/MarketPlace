import type { Prisma } from "@prisma/client";
import type { listingCardSelect } from "@/lib/listing-card-select";
import { BrowseCard } from "@/features/browse/browse-card";

type Props = {
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
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-y-5">
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
