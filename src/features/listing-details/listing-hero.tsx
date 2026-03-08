import { formatCurrencyFromCents } from "@/lib/currency";
import { getConditionLabel } from "@/features/listing-details/utils";

type Props = {
  category: string;
  condition: "NEW" | "USED" | "REFURBISHED";
  title: string;
  price: number;
  currency: "MKD" | "EUR";
  location: string;
  description?: string;
  locale: "en" | "mk";
  text: {
    price: string;
  };
};

export function ListingHero({
  category,
  condition,
  title,
  price,
  currency,
  location,
  description,
  locale,
  text,
}: Props) {
  const conditionLabel = getConditionLabel(locale, condition);
  const formattedPrice = formatCurrencyFromCents(price, currency);
  const descriptionPreview = description?.trim() || "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{conditionLabel}</span>
        <span>•</span>
        <span>{category}</span>
        <span>•</span>
        <span>{location}</span>
      </div>

      <h1 className="text-[2.2rem] font-semibold leading-tight tracking-[-0.05em] text-foreground sm:text-[2.9rem]">
        {title}
      </h1>

      <div className="space-y-1">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {text.price}
        </p>
        <div className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-primary sm:text-[2.5rem]">
          {formattedPrice}
        </div>
      </div>

      {descriptionPreview ? (
        <p className="max-w-[52ch] text-sm leading-7 text-foreground/80">
          {descriptionPreview}
        </p>
      ) : null}
    </div>
  );
}
