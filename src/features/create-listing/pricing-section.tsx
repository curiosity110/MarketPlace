"use client";

import { Currency, ListingCondition } from "@prisma/client";
import { FormBlock } from "@/components/ui/layout";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MARKETPLACE_CURRENCIES } from "@/lib/currency";
import { resolveCreateConditionOptions } from "@/features/create-listing/utils";

type Props = {
  title: string;
  description: string;
  priceLabel: string;
  pricePlaceholder: string;
  currencyLabel: string;
  conditionLabel: string;
  conditionLabels: Record<ListingCondition, string>;
  value: string;
  currency: Currency;
  condition: ListingCondition;
  priceError: string | null;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (value: Currency) => void;
  onConditionChange: (value: ListingCondition) => void;
};

export function PricingSection({
  title,
  description,
  priceLabel,
  pricePlaceholder,
  currencyLabel,
  conditionLabel,
  conditionLabels,
  value,
  currency,
  condition,
  priceError,
  onPriceChange,
  onCurrencyChange,
  onConditionChange,
}: Props) {
  const conditionOptions = resolveCreateConditionOptions(conditionLabels);

  return (
    <FormBlock title={title} description={description}>
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
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
            {priceError ? (
              <p className="text-sm text-destructive">{priceError}</p>
            ) : null}
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

        <div className="space-y-2">
          <span className="text-sm font-medium">{conditionLabel}</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {conditionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onConditionChange(option.value)}
                className={`rounded-[1rem] px-3 py-3 text-left text-sm ring-1 transition-colors ${
                  condition === option.value
                    ? "bg-primary/8 ring-primary/30"
                    : "bg-background ring-border/60"
                }`}
              >
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </FormBlock>
  );
}
