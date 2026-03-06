import type { ComponentProps } from "react";
import { ListingCard } from "@/components/listing-card";
import { Card, CardContent } from "@/components/ui/card";

type ListingCardData = ComponentProps<typeof ListingCard>["listing"];

type ProfileListingsSectionProps = {
  locale: "en" | "mk";
  currentAuthUserId: string;
  activeLabel: string;
  listingsLabel: string;
  emptyLabel: string;
  activeListings: ListingCardData[];
};

export function ProfileListingsSection({
  locale,
  currentAuthUserId,
  activeLabel,
  listingsLabel,
  emptyLabel,
  activeListings,
}: ProfileListingsSectionProps) {
  return (
    <section className="max-w-full min-w-0 space-y-3 overflow-x-hidden">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {activeLabel} {listingsLabel}
        </h2>
        <span className="text-sm text-muted-foreground">{activeListings.length}</span>
      </div>
      {activeListings.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">{emptyLabel}</CardContent>
        </Card>
      ) : (
        <div className="responsive-grid gap-4">
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
    </section>
  );
}
