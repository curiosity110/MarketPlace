import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { uiTypography } from "@/components/ui/ui-patterns";
import type { HomeLatestListing, HomeText } from "@/components/home/home.types";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  text: HomeText;
  createHref: string;
  latestListings: HomeLatestListing[];
  currentAuthUserId?: string | null;
  favoriteListingIdSet: Set<string>;
};

export function HomeLatestListingsSection({
  locale,
  text,
  createHref,
  latestListings,
  currentAuthUserId,
  favoriteListingIdSet,
}: Props) {
  return (
    <section className="max-w-full min-w-0 space-y-5 overflow-x-hidden">
      <div className="min-w-0">
        <h2 className={uiTypography.pageTitle}>
          {text.latestListings}
        </h2>
      </div>

      {latestListings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{text.noListings}</p>
            <Link href={createHref} className="mt-4 inline-block">
              <Button>{text.listItem}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="responsive-grid gap-4">
            {latestListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                locale={locale}
                currentAuthUserId={currentAuthUserId}
                isFavorited={favoriteListingIdSet.has(listing.id)}
              />
            ))}
          </div>
          <div className="text-center">
            <Link href="/browse">
              <Button variant="outline">{text.browseAll}</Button>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
