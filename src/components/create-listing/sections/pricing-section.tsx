"use client";

import { Currency, ListingCondition } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MARKETPLACE_CURRENCIES } from "@/lib/currency";

type Props = {
  titleLabel: string;
  priceLabel: string;
  pricePlaceholder: string;
  priceHelperLabel: string;
  currencyLabel: string;
  conditionLabel: string;
  conditionLabels: Record<ListingCondition, string>;
  value: string;
  currency: Currency;
  condition: ListingCondition;
  priceError: string | null;
  isActiveStep: boolean;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (value: Currency) => void;
  onConditionChange: (value: ListingCondition) => void;
};

export function CreateListingPricingSection({
  titleLabel,
  priceLabel,
  pricePlaceholder,
  priceHelperLabel,
  currencyLabel,
  conditionLabel,
  conditionLabels,
  value,
  currency,
  condition,
  priceError,
  isActiveStep,
  onPriceChange,
  onCurrencyChange,
  onConditionChange,
}: Props) {
  return (
    <div
      className={`max-w-full min-w-0 space-y-4 rounded-2xl bg-card/80 p-4 ring-1 ring-border/60 sm:p-5 ${
        isActiveStep ? "ring-primary/30" : ""
      }`}
    >
      <h3 className="text-sm font-semibold tracking-tight">{titleLabel}</h3>
      <div className="grid max-w-full min-w-0 gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium">{priceLabel}</span>
          <Input
            name="price"
            type="number"
            min="1"
            step="1"
            value={value}
            onChange={(event) => onPriceChange(event.target.value)}
            placeholder={pricePlaceholder}
            required
          />
          <p className="text-xs text-muted-foreground">{priceHelperLabel}</p>
          {priceError ? <p className="text-xs font-medium text-destructive">{priceError}</p> : null}
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium">{currencyLabel}</span>
          <Select
            name="currency"
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value as Currency)}
          >
            {MARKETPLACE_CURRENCIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">{conditionLabel}</span>
        <div className="grid grid-cols-3 gap-2">
          {[ListingCondition.NEW, ListingCondition.USED, ListingCondition.REFURBISHED].map(
            (value) => (
              <button
                key={value}
                type="button"
                onClick={() => onConditionChange(value)}
                className={`rounded-xl px-2 py-2 text-xs font-semibold ring-1 transition-colors ${
                  condition === value
                    ? "bg-primary/10 text-foreground ring-primary/35"
                    : "bg-background text-muted-foreground ring-border/60"
                }`}
              >
                {conditionLabels[value]}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
