import type { Prisma } from "@prisma/client";
import type { listingCardSelect } from "@/lib/listing-card-select";
import { BrowseCard } from "@/features/browse/browse-card";

type Props = {
  listings: Array<Prisma.ListingGetPayload<typeof listingCardSelect>>;
  locale: "en" | "mk";
  currentAuthUserId?: string | null;
  favoriteListingIdSet: Set<string>;
  browseQuery: string;
  title: string;
};

export function ListingSimilar({
  listings,
  locale,
  currentAuthUserId,
  favoriteListingIdSet,
  browseQuery,
  title,
}: Props) {
  if (listings.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5 lg:grid-cols-3 xl:grid-cols-4">
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
    </section>
  );
}
