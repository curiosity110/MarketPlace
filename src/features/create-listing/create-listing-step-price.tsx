"use client";

import { Currency } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  CreateListingPhoneCountryOption,
  CreateListingPlanOption,
} from "@/features/create-listing/types";

type Props = {
  heading: string;
  helperText: string;
  priceLabel: string;
  pricePlaceholder: string;
  priceValue: string;
  currency: Currency;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneCountry: string;
  phoneValue: string;
  phoneCountryOptions: CreateListingPhoneCountryOption[];
  phoneError: string | null;
  showPlanSelector: boolean;
  planLabel: string;
  payPerListingLabel: string;
  subscriptionLabel: string;
  daysActiveLabel: string;
  monthlyUnlimitedLabel: string;
  packageHint: string;
  plan: CreateListingPlanOption;
  isActionBusy: boolean;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onPhoneCountryChange: (country: string) => void;
  onPhoneChange: (phone: string) => void;
  onPlanChange: (plan: CreateListingPlanOption) => void;
};

export function CreateListingStepPrice({
  heading,
  helperText,
  priceLabel,
  pricePlaceholder,
  priceValue,
  currency,
  phoneLabel,
  phonePlaceholder,
  phoneCountry,
  phoneValue,
  phoneCountryOptions,
  phoneError,
  showPlanSelector,
  planLabel,
  payPerListingLabel,
  subscriptionLabel,
  daysActiveLabel,
  monthlyUnlimitedLabel,
  packageHint,
  plan,
  isActionBusy,
  onPriceChange,
  onCurrencyChange,
  onPhoneCountryChange,
  onPhoneChange,
  onPlanChange,
}: Props) {
  return (
    <section className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-[1.9rem] font-semibold tracking-[-0.045em] text-foreground">
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground">{helperText}</p>
      </div>

      <div className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">{priceLabel}</span>
          <div className="flex items-center gap-3 rounded-[1.5rem] bg-card/65 px-4 py-4 ring-1 ring-border/40">
            <span className="text-xl text-muted-foreground">€</span>
            <Input
              name="price"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={priceValue}
              onChange={(event) => onPriceChange(event.target.value)}
              placeholder={pricePlaceholder}
              required
              disabled={isActionBusy}
              className="h-auto border-0 bg-transparent px-0 py-0 text-3xl font-semibold tracking-[-0.04em] text-foreground shadow-none ring-0 placeholder:text-muted-foreground/65 focus-visible:ring-0"
            />
            <Select
              name="currency"
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value as Currency)}
              disabled={isActionBusy}
              className="h-11 w-24 rounded-full border-0 bg-background/90 px-4 text-sm shadow-none ring-1 ring-border/40"
            >
              <option value={Currency.MKD}>MKD</option>
              <option value={Currency.EUR}>EUR</option>
            </Select>
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">{phoneLabel}</span>
          <div className="flex gap-2">
            <Select
              value={phoneCountry}
              onChange={(event) => onPhoneCountryChange(event.target.value)}
              disabled={isActionBusy}
              className="h-14 w-24 rounded-[1.25rem] border-0 bg-card/70 px-3 text-base shadow-none ring-1 ring-border/45"
            >
              {phoneCountryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Input
              name="phone"
              type="tel"
              value={phoneValue}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder={phonePlaceholder}
              disabled={isActionBusy}
              className="h-14 rounded-[1.25rem] border-0 bg-card/70 px-4 text-base shadow-none ring-1 ring-border/45"
            />
          </div>
          {phoneError ? <p className="text-sm text-destructive">{phoneError}</p> : null}
        </label>

        {showPlanSelector ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{planLabel}</p>
              <p className="text-sm text-muted-foreground">{packageHint}</p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onPlanChange("pay-per-listing")}
                disabled={isActionBusy}
                className={`flex w-full items-center justify-between rounded-[1.35rem] px-4 py-4 text-left transition-colors ${
                  plan === "pay-per-listing"
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/25"
                    : "bg-card/60 text-foreground ring-1 ring-border/40 hover:bg-card"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{payPerListingLabel}</p>
                  <p className="text-xs text-muted-foreground">{daysActiveLabel}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">€4</p>
              </button>

              <button
                type="button"
                onClick={() => onPlanChange("subscription")}
                disabled={isActionBusy}
                className={`flex w-full items-center justify-between rounded-[1.35rem] px-4 py-4 text-left transition-colors ${
                  plan === "subscription"
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/25"
                    : "bg-card/60 text-foreground ring-1 ring-border/40 hover:bg-card"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{subscriptionLabel}</p>
                  <p className="text-xs text-muted-foreground">{monthlyUnlimitedLabel}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">€30/mo</p>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
