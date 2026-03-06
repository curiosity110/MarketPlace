import type { ListingCardDTO } from "@/lib/listing-card-select";
import { ListingCard } from "@/components/listing-card";
import type { ListingSimilarityData } from "@/app/browse/browse-page.types";

type Props = {
  listings: ListingCardDTO[];
  locale: "en" | "mk";
  currentAuthUserId?: string | null;
  favoriteListingIdSet: Set<string>;
  browseQuery: string;
  similarityDataByListingId: Map<string, ListingSimilarityData>;
};

export function BrowseResultsGrid({
  listings,
  locale,
  currentAuthUserId,
  favoriteListingIdSet,
  browseQuery,
  similarityDataByListingId,
}: Props) {
  return (
    <div className="grid max-w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          locale={locale}
          currentAuthUserId={currentAuthUserId}
          isFavorited={favoriteListingIdSet.has(listing.id)}
          browseQuery={browseQuery}
          similarityData={similarityDataByListingId.get(listing.id)}
        />
      ))}
    </div>
  );
}
