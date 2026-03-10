"use client";

import { Currency } from "@prisma/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CreateListingDynamicFieldsSection } from "@/components/create-listing/sections/dynamic-fields-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  CreateListingPhoneCountryOption,
  CreateListingPlanOption,
  CreateListingTemplateMap,
} from "@/features/create-listing/types";

type Props = {
  locale: "en" | "mk";
  heading: string;
  helperText?: string;
  priceLabel: string;
  pricePlaceholder: string;
  priceValue: string;
  priceError: string | null;
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
  addMoreDetailsLabel: string;
  hideMoreDetailsLabel: string;
  moreDetailsHint: string;
  moreDetailsEmptyLabel: string;
  showMoreDetails: boolean;
  selectedCategoryId: string;
  templatesByCategory: CreateListingTemplateMap;
  dynamicValues: Record<string, string>;
  secondaryTemplateKeys: string[];
  isActionBusy: boolean;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onPhoneCountryChange: (country: string) => void;
  onPhoneChange: (phone: string) => void;
  onPlanChange: (plan: CreateListingPlanOption) => void;
  onToggleMoreDetails: () => void;
  onDynamicValuesChange: (values: Record<string, string>) => void;
};

export function CreateListingStepPrice({
  locale,
  heading,
  helperText,
  priceLabel,
  pricePlaceholder,
  priceValue,
  priceError,
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
  addMoreDetailsLabel,
  hideMoreDetailsLabel,
  moreDetailsHint,
  moreDetailsEmptyLabel,
  showMoreDetails,
  selectedCategoryId,
  templatesByCategory,
  dynamicValues,
  secondaryTemplateKeys,
  isActionBusy,
  onPriceChange,
  onCurrencyChange,
  onPhoneCountryChange,
  onPhoneChange,
  onPlanChange,
  onToggleMoreDetails,
  onDynamicValuesChange,
}: Props) {
  void locale;

  const currencyMark = currency === Currency.MKD ? "MKD" : "EUR";
  const hasSecondaryFields = secondaryTemplateKeys.length > 0;

  return (
    <section className="space-y-5">
      <div className="max-w-[27rem] space-y-1">
        <h2 className="text-[1.55rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[1.9rem]">
          {heading}
        </h2>
        {helperText ? (
          <p className="text-[0.88rem] leading-5 text-[#74685c]">{helperText}</p>
        ) : null}
      </div>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-[0.92rem] font-medium text-foreground">{priceLabel}</span>
          <div className="grid grid-cols-[auto,minmax(0,1fr),auto] items-center gap-2 rounded-[1.12rem] bg-[#eee8e2] px-3 py-3 ring-1 ring-black/[0.04] sm:px-4">
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-background/88 px-2.5 text-[0.76rem] font-semibold tracking-[0.08em] text-[#76695d] shadow-[0_8px_18px_-18px_rgba(48,35,24,0.35)]">
              {currencyMark}
            </span>
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
              className="h-auto min-w-0 border-0 bg-transparent px-0 py-0 text-[1.95rem] font-semibold tracking-[-0.06em] text-foreground shadow-none ring-0 placeholder:text-[#9a8f84] focus-visible:ring-0 sm:text-[2.25rem]"
            />
            <Select
              name="currency"
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value as Currency)}
              disabled={isActionBusy}
              className="h-9 w-[5rem] rounded-full border-0 bg-background/92 px-2.5 text-sm font-medium shadow-none ring-0"
            >
              <option value={Currency.MKD}>MKD</option>
              <option value={Currency.EUR}>EUR</option>
            </Select>
          </div>
          {priceError ? <p className="text-sm text-destructive">{priceError}</p> : null}
        </label>

        <label className="block space-y-2">
          <span className="text-[0.92rem] font-medium text-foreground">{phoneLabel}</span>
          <div className="grid grid-cols-[5.5rem,minmax(0,1fr)] gap-2">
            <Select
              value={phoneCountry}
              onChange={(event) => onPhoneCountryChange(event.target.value)}
              disabled={isActionBusy}
              className="h-[3.15rem] rounded-[0.95rem] border-0 bg-[#eee8e2] px-3 text-[0.92rem] font-medium shadow-none ring-0"
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
              className="h-[3.15rem] rounded-[0.95rem] border-0 bg-[#eee8e2] px-4 text-[0.96rem] shadow-none ring-0 placeholder:text-[#8a7d72]"
            />
          </div>
          {phoneError ? <p className="text-sm text-destructive">{phoneError}</p> : null}
        </label>

        {showPlanSelector ? (
          <div className="space-y-2 rounded-[1.08rem] bg-[#f6f1eb] px-3.5 py-3.5 ring-1 ring-black/[0.04]">
            <div className="space-y-1">
              <p className="text-[0.92rem] font-medium text-foreground">{planLabel}</p>
              <p className="max-w-[30rem] text-[0.8rem] leading-5 text-[#74685c]">
                {packageHint}
              </p>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => onPlanChange("pay-per-listing")}
                disabled={isActionBusy}
                className={`flex min-h-[3.5rem] w-full items-center justify-between gap-3 rounded-[0.9rem] px-3.5 py-2.5 text-left transition-colors ${
                  plan === "pay-per-listing"
                    ? "bg-[#ebddd2] text-foreground ring-1 ring-[#d6bcae]"
                    : "bg-background/70 text-foreground ring-1 ring-black/[0.04] hover:bg-background"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-[0.92rem] font-medium">{payPerListingLabel}</p>
                  <p className="text-[0.75rem] text-[#74685c]">{daysActiveLabel}</p>
                </div>
                <p className="text-[0.92rem] font-semibold tracking-tight text-foreground">
                  4 EUR
                </p>
              </button>

              <button
                type="button"
                onClick={() => onPlanChange("subscription")}
                disabled={isActionBusy}
                className={`flex min-h-[3.5rem] w-full items-center justify-between gap-3 rounded-[0.9rem] px-3.5 py-2.5 text-left transition-colors ${
                  plan === "subscription"
                    ? "bg-[#ebddd2] text-foreground ring-1 ring-[#d6bcae]"
                    : "bg-background/70 text-foreground ring-1 ring-black/[0.04] hover:bg-background"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-[0.92rem] font-medium">{subscriptionLabel}</p>
                  <p className="text-[0.75rem] text-[#74685c]">{monthlyUnlimitedLabel}</p>
                </div>
                <p className="text-[0.92rem] font-semibold tracking-tight text-foreground">
                  30 EUR/mo
                </p>
              </button>
            </div>
          </div>
        ) : null}

        {hasSecondaryFields ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onToggleMoreDetails}
              disabled={isActionBusy}
              className="flex min-h-[2.8rem] w-full items-center justify-between rounded-[0.9rem] border border-dashed border-border/45 bg-transparent px-3.5 py-2 text-left text-[0.88rem] font-medium text-[#6f645a] transition-colors hover:border-border/65 hover:text-foreground"
            >
              <span>{showMoreDetails ? hideMoreDetailsLabel : addMoreDetailsLabel}</span>
              {showMoreDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showMoreDetails ? (
              <div className="space-y-2 rounded-[0.95rem] bg-muted/14 px-3 py-3 ring-1 ring-black/[0.04]">
                <p className="max-w-[30rem] text-[0.8rem] leading-5 text-[#74685c]">
                  {moreDetailsHint}
                </p>
                <CreateListingDynamicFieldsSection
                  titleLabel=""
                  emptyLabel={moreDetailsEmptyLabel}
                  categoryId={selectedCategoryId}
                  templatesByCategory={templatesByCategory}
                  initialValues={dynamicValues}
                  locale={locale}
                  visibleTemplateKeys={secondaryTemplateKeys}
                  includeFormNames={false}
                  onValuesChange={onDynamicValuesChange}
                  compact
                  showHeader={false}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
