import type { ComponentProps } from "react";
import { ListingCard } from "@/components/listing-card";
import { uiTypography } from "@/components/ui/ui-patterns";

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
      <div className="flex items-end justify-between gap-2">
        <div className="space-y-1">
          <h2 className={uiTypography.sectionTitle}>
            {activeLabel} {listingsLabel}
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">{activeListings.length}</span>
      </div>
      {activeListings.length === 0 ? (
        <div className="rounded-2xl bg-muted/30 px-4 py-6 text-sm text-muted-foreground ring-1 ring-black/5 dark:ring-white/10">
          {emptyLabel}
        </div>
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
    </section>
  );
}
