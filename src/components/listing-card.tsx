import Image from "next/image";
import Link from "next/link";
import type {
  Category,
  CategoryFieldTemplate,
  City,
  ListingCondition,
  Listing,
  ListingFieldValue,
  ListingImage,
} from "@prisma/client";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyFromCents } from "@/lib/currency";
import { localizeCategoryPath } from "@/lib/category-label";

type ListingCardProps = {
  listing: Listing & {
    seller?: {
      name: string | null;
      email: string;
    };
    city: City;
    category: Category & {
      parent?: Category | null;
      fieldTemplates?: CategoryFieldTemplate[];
    };
    images: ListingImage[];
    fieldValues: ListingFieldValue[];
  };
  locale?: "en" | "mk";
};

export function ListingCard({ listing, locale = "en" }: ListingCardProps) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        noImage: "Нема слика",
        seller: "Продавач",
        by: "Од",
        listed: "Објавено",
      }
    : {
        noImage: "No image",
        seller: "Seller",
        by: "By",
        listed: "Listed",
      };
  const conditionLabelByValue: Record<ListingCondition, string> = isMk
    ? { NEW: "Ново", USED: "Користено", REFURBISHED: "Рефурбиширано" }
    : { NEW: "New", USED: "Used", REFURBISHED: "Refurbished" };

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

  const categoryLabel = localizeCategoryPath(listing.category, locale);
  const locationCategoryLine = categoryLabel
    ? `${listing.city.name} • ${categoryLabel}`
    : listing.city.name;
  const sellerLabel =
    listing.seller?.name || listing.seller?.email?.split("@")[0] || text.seller;
  const conditionLabel = conditionLabelByValue[listing.condition];
  const formattedPrice = formatCurrencyFromCents(listing.priceCents, listing.currency);

  return (
    <Link href={`/listing/${listing.id}`} className="group block">
      <Card className="h-full overflow-hidden border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={listing.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/60 text-muted-foreground dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80">
                <ImageOff size={16} />
              </span>
              <span className="text-xs font-medium">{text.noImage}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />

          <div className="absolute left-3 top-3">
            <Badge variant="secondary" className="border-white/50 bg-background/90 shadow-sm">
              {conditionLabel}
            </Badge>
          </div>

          <div className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/95 px-3 py-1 text-sm font-bold text-primary shadow-sm dark:border-border dark:bg-background/95">
            {formattedPrice}
          </div>
        </div>

        <CardContent className="space-y-3 p-4">
          <h3 className="line-clamp-2 min-h-[2.7rem] text-base font-extrabold leading-tight tracking-tight transition-colors group-hover:text-primary">
            {listing.title}
          </h3>

          <p className="text-xs text-muted-foreground">{locationCategoryLine}</p>
          <p className="text-xs text-muted-foreground">
            {text.by} {sellerLabel}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {highlights.map((item) => (
              <Badge key={item.label} variant="primary">
                {item.value}
              </Badge>
            ))}
          </div>

          <p className="border-t border-border/60 pt-2 text-xs text-muted-foreground">
            {text.listed}{" "}
            {new Date(listing.createdAt).toLocaleDateString(isMk ? "mk-MK" : "en-US")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
