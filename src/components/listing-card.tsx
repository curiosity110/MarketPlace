import Link from "next/link";
import type { Category, CategoryFieldTemplate, City, Listing, ListingFieldValue, ListingImage } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ListingCardProps = {
  listing: Listing & {
    city: City;
    category: Category & { fieldTemplates: CategoryFieldTemplate[] };
    images: ListingImage[];
    fieldValues: ListingFieldValue[];
  };
};

export function ListingCard({ listing }: ListingCardProps) {
  const firstImage = listing.images[0]?.url;
  const valuesByKey = Object.fromEntries(listing.fieldValues.map((field) => [field.key, field.value]));
  const highlights = listing.category.fieldTemplates
    .map((template) => ({ label: template.label, value: valuesByKey[template.key] }))
    .filter((item) => item.value)
    .slice(0, 3);

  return (
    <Link href={`/listing/${listing.id}`} className="block">
      <Card className="overflow-hidden transition-colors hover:bg-muted/40">
        <CardContent className="flex gap-4 p-4">
          {firstImage ? (
            <img src={firstImage} alt={listing.title} className="h-24 w-24 rounded-md object-cover" />
          ) : (
            <div className="h-24 w-24 rounded-md bg-muted" />
          )}
          <div className="min-w-0 space-y-1">
            <p className="truncate text-base font-semibold">{listing.title}</p>
            <p className="text-sm text-muted-foreground">{listing.city.name} · {listing.category.name}</p>
            <p className="text-sm font-medium">{(listing.priceCents / 100).toFixed(2)} {listing.currency}</p>
            <div className="flex flex-wrap gap-1">
              <Badge>{listing.condition}</Badge>
              {highlights.map((item) => (
                <Badge key={item.label}>{item.label}: {item.value}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
