import { BrowseResultsGrid as BaseBrowseResultsGrid } from "@/components/browse-page";
import type { ListingSimilarityData } from "@/features/browse/types";
import type { listingCardSelect } from "@/lib/listing-card-select";
import type { Prisma } from "@prisma/client";

type Props = {
  listings: Array<Prisma.ListingGetPayload<typeof listingCardSelect>>;
  locale: "en" | "mk";
  currentAuthUserId?: string | null;
  favoriteListingIdSet: Set<string>;
  browseQuery: string;
  similarityDataByListingId: Map<string, ListingSimilarityData>;
};

export function BrowseResultsGrid(props: Props) {
  return <BaseBrowseResultsGrid {...props} />;
}
