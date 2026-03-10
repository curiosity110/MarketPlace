import { MapPin, Tag, UserRound } from "lucide-react";
import { formatCurrencyFromCents } from "@/lib/currency";
import { getConditionLabel } from "@/features/listing-details/utils";

type Props = {
  category: string;
  condition: "NEW" | "USED" | "REFURBISHED";
  title: string;
  price: number;
  currency: "MKD" | "EUR";
  location: string;
  sellerName: string;
  locale: "en" | "mk";
  text: {
    price: string;
    seller: string;
  };
};

export function ListingHero({
  category,
  condition,
  title,
  price,
  currency,
  location,
  sellerName,
  locale,
  text,
}: Props) {
  const conditionLabel = getConditionLabel(locale, condition);
  const formattedPrice = formatCurrencyFromCents(price, currency);

  return (
    <section className="rounded-[1.45rem] bg-card/72 p-4 ring-1 ring-black/5 dark:ring-white/10 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <span className="rounded-full bg-muted/42 px-2.5 py-1">{conditionLabel}</span>
        <span className="rounded-full bg-muted/42 px-2.5 py-1">{category}</span>
      </div>

      <h1 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.04em] text-foreground sm:text-[2.35rem]">
        {title}
      </h1>

      <div className="mt-4 space-y-1">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {text.price}
        </p>
        <div className="text-[1.95rem] font-semibold leading-none tracking-[-0.04em] text-primary sm:text-[2.4rem]">
          {formattedPrice}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/78">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={14} className="text-muted-foreground" />
          {location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Tag size={14} className="text-muted-foreground" />
          {category}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border/45 pt-4 text-sm text-foreground/82">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/55 text-foreground">
          <UserRound size={15} />
        </span>
        <span className="text-muted-foreground">{text.seller}</span>
        <span className="font-medium text-foreground">{sellerName}</span>
      </div>
    </section>
  );
}
