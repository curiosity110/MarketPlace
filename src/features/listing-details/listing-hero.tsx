import { formatCurrencyFromCents } from "@/lib/currency";
import { getConditionLabel } from "@/features/listing-details/utils";

type Props = {
  category: string;
  condition: "NEW" | "USED" | "REFURBISHED";
  title: string;
  price: number;
  currency: "MKD" | "EUR";
  location: string;
  dateListed: string;
  locale: "en" | "mk";
  text: {
    price: string;
    listed: string;
  };
};

export function ListingHero({
  category,
  condition,
  title,
  price,
  currency,
  location,
  dateListed,
  locale,
  text,
}: Props) {
  const conditionLabel = getConditionLabel(locale, condition);
  const formattedPrice = formatCurrencyFromCents(price, currency);

  return (
    <section className="rounded-[1.45rem] bg-card/72 p-4 ring-1 ring-black/5 dark:ring-white/10 sm:p-5">
      <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.04em] text-foreground sm:text-[2.35rem]">
        {title}
      </h1>

      <p className="mt-3 text-[1.95rem] font-bold leading-none tracking-[-0.04em] text-orange-500 sm:text-[2.4rem]">
        {formattedPrice}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {conditionLabel}
        </span>
        <span className="rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {category}
        </span>
        <span className="rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {location}
        </span>
        {dateListed ? (
          <span className="rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {text.listed} {dateListed}
          </span>
        ) : null}
      </div>
    </section>
  );
}
