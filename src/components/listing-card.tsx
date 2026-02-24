import Link from "next/link";
import type { Listing, ListingImage, City } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ListingCardProps = {
  listing: Listing & { city: City; images: ListingImage[] };
};

export function ListingCard({ listing }: ListingCardProps) {
  const firstImage = listing.images[0]?.url;

  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <Card className="overflow-hidden transition-colors hover:bg-muted/60">
        <CardContent className="flex gap-4 p-4">
          {firstImage ? (
            <img src={firstImage} alt={listing.title} className="h-24 w-24 rounded-md object-cover" />
          ) : (
            <div className="h-24 w-24 rounded-md bg-muted" />
          )}
          <div className="min-w-0 space-y-1">
            <p className="truncate text-base font-semibold">{listing.title}</p>
            <p className="text-sm text-muted-foreground">{listing.city.name}</p>
            <p className="text-sm font-medium">{(listing.priceCents / 100).toFixed(2)} {listing.currency}</p>
            <Badge>{listing.condition}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
