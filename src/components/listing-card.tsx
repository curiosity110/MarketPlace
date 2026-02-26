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
    .slice(0, 3);
  const categoryLabel = listing.category.parent
    ? `${listing.category.parent.name} / ${listing.category.name}`
    : listing.category.name;

  return (
    <Link href={`/listing/${listing.id}`} className="block group">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 h-full flex flex-col">
        <div className="relative w-full aspect-square bg-muted overflow-hidden">
          {firstImage ? (
            <img
              src={firstImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            €{(listing.priceCents / 100).toFixed(0)}
          </div>
        </div>

        <CardContent className="flex-1 flex flex-col gap-2 p-4">
          <p className="truncate text-base font-bold text-card-foreground group-hover:text-primary transition-colors">
            {listing.title}
          </p>

          <p className="text-sm text-muted-foreground">
            {listing.city.name} · {categoryLabel}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            <Badge className="bg-secondary/20 text-secondary border border-secondary/30">
              {listing.condition}
            </Badge>
            {highlights.slice(0, 1).map((item) => (
              <Badge
                key={item.label}
                className="bg-primary/20 text-primary border border-primary/30"
              >
                {item.value}
              </Badge>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
            Listed {new Date(listing.createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
