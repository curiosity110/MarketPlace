import Image from "next/image";
import Link from "next/link";
import type {
  Category,
  CategoryFieldTemplate,
  City,
  Listing,
  ListingFieldValue,
  ListingImage,
} from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyFromCents } from "@/lib/currency";

type ListingCardProps = {
  listing: Listing & {
    city: City;
    category: Category & {
      parent?: Category | null;
      fieldTemplates?: CategoryFieldTemplate[];
    };
    images: ListingImage[];
    fieldValues: ListingFieldValue[];
  };
};

export function ListingCard({ listing }: ListingCardProps) {
  const firstImage = listing.images[0]?.url;
  const valuesByKey = Object.fromEntries(
    listing.fieldValues.map((field) => [field.key, field.value]),
  );

  const templates = listing.category.fieldTemplates ?? [];
  const highlights = templates
    .map((template) => ({
      label: template.label,
      value: valuesByKey[template.key],
    }))
    .filter((item) => item.value)
    .slice(0, 2);

  const categoryLabel = listing.category.parent
    ? `${listing.category.parent.name} / ${listing.category.name}`
    : listing.category.name;

  return (
    <Link href={`/listing/${listing.id}`} className="group block">
      <Card className="h-full overflow-hidden border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={listing.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
              <span className="text-sm text-muted-foreground">No image</span>
            </div>
          )}

          <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-primary shadow-sm dark:bg-background/95">
            {formatCurrencyFromCents(listing.priceCents, listing.currency)}
          </div>
        </div>

        <CardContent className="space-y-3 p-4">
          <h3 className="line-clamp-2 text-base font-bold leading-tight transition-colors group-hover:text-primary">
            {listing.title}
          </h3>

          <p className="text-xs text-muted-foreground">
            {listing.city.name} | {categoryLabel}
          </p>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{listing.condition}</Badge>
            {highlights.map((item) => (
              <Badge key={item.label} variant="primary">
                {item.value}
              </Badge>
            ))}
          </div>

          <p className="border-t border-border/60 pt-2 text-xs text-muted-foreground">
            Listed {new Date(listing.createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

