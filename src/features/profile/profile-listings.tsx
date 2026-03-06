import { EmptyState, SectionBlock } from "@/components/ui/layout";
import { ListingCard } from "@/components/listing-card";
import type { ProfileListingCardData } from "@/features/profile/types";

type Props = {
  locale: "en" | "mk";
  currentAuthUserId: string;
  activeLabel: string;
  listingsLabel: string;
  emptyLabel: string;
  activeListings: ProfileListingCardData[];
};

export function ProfileListings({
  locale,
  currentAuthUserId,
  activeLabel,
  listingsLabel,
  emptyLabel,
  activeListings,
}: Props) {
  return (
    <SectionBlock
      title={`${activeLabel} ${listingsLabel}`}
      action={<span className="text-sm text-muted-foreground">{activeListings.length}</span>}
      className="space-y-4"
      contentClassName="space-y-4"
    >
      {activeListings.length === 0 ? (
        <EmptyState title={emptyLabel} />
      ) : (
        <div className="responsive-grid gap-3">
          {activeListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
              currentAuthUserId={currentAuthUserId}
            />
          ))}
        </div>
      )}
    </SectionBlock>
  );
}
