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
  initialDynamicValues?: Record<string, string>;
  isActionBusy: boolean;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onPhoneCountryChange: (country: string) => void;
  onPhoneChange: (phone: string) => void;
  onPlanChange: (plan: CreateListingPlanOption) => void;
  onToggleMoreDetails: () => void;
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
  initialDynamicValues,
  isActionBusy,
  onPriceChange,
  onCurrencyChange,
  onPhoneCountryChange,
  onPhoneChange,
  onPlanChange,
  onToggleMoreDetails,
}: Props) {
  return (
    <section className="space-y-8">
      <div className="max-w-[28rem] space-y-2">
        <h2 className="text-[1.85rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[1.95rem]">
          {heading}
        </h2>
        {helperText ? (
          <p className="text-[0.95rem] leading-6 text-[#74685c]">{helperText}</p>
        ) : null}
      </div>

      <div className="space-y-6">
        <label className="block space-y-2.5">
          <span className="text-[0.95rem] font-medium text-foreground">{priceLabel}</span>
          <div className="flex items-center gap-3 rounded-[1.1rem] bg-[#ece7e1] px-4 py-4.5 sm:px-5">
            <span className="text-xl text-muted-foreground">
              {currency === Currency.MKD ? "ден" : "€"}
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
              className="h-auto border-0 bg-transparent px-0 py-0 text-[2rem] font-semibold tracking-[-0.05em] text-foreground shadow-none ring-0 placeholder:text-[#9a8f84] focus-visible:ring-0 sm:text-[2.2rem]"
            />
            <Select
              name="currency"
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value as Currency)}
              disabled={isActionBusy}
              className="h-11 w-24 rounded-full border-0 bg-background/90 px-4 text-sm shadow-none ring-0"
            >
              <option value={Currency.MKD}>MKD</option>
              <option value={Currency.EUR}>EUR</option>
            </Select>
          </div>
          {priceError ? <p className="text-sm text-destructive">{priceError}</p> : null}
        </label>

        <label className="block space-y-2.5">
          <span className="text-[0.95rem] font-medium text-foreground">{phoneLabel}</span>
          <div className="flex gap-2">
            <Select
              value={phoneCountry}
              onChange={(event) => onPhoneCountryChange(event.target.value)}
              disabled={isActionBusy}
              className="h-[3.6rem] w-24 rounded-[1.05rem] border-0 bg-[#ece7e1] px-3 text-base shadow-none ring-0"
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
              className="h-[3.6rem] rounded-[1.05rem] border-0 bg-[#ece7e1] px-[1.125rem] text-base shadow-none ring-0 placeholder:text-[#8a7d72]"
            />
          </div>
          {phoneError ? <p className="text-sm text-destructive">{phoneError}</p> : null}
        </label>

        {showPlanSelector ? (
          <div className="space-y-3 rounded-[1.05rem] bg-[#f4eee8] p-4.5">
            <div className="space-y-1.5">
              <p className="text-[0.95rem] font-medium text-foreground">{planLabel}</p>
              <p className="max-w-[30rem] text-[0.92rem] leading-6 text-[#74685c]">{packageHint}</p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onPlanChange("pay-per-listing")}
                disabled={isActionBusy}
                className={`flex min-h-[4.5rem] w-full items-center justify-between gap-3 rounded-[1rem] px-4 py-4 text-left transition-colors ${
                  plan === "pay-per-listing"
                    ? "bg-[#e8d3c5] text-foreground ring-1 ring-[#d3b8a7]"
                    : "bg-background/65 text-foreground hover:bg-background"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{payPerListingLabel}</p>
                  <p className="text-[0.82rem] text-[#74685c]">{daysActiveLabel}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">€4</p>
              </button>

              <button
                type="button"
                onClick={() => onPlanChange("subscription")}
                disabled={isActionBusy}
                className={`flex min-h-[4.5rem] w-full items-center justify-between gap-3 rounded-[1rem] px-4 py-4 text-left transition-colors ${
                  plan === "subscription"
                    ? "bg-[#e8d3c5] text-foreground ring-1 ring-[#d3b8a7]"
                    : "bg-background/65 text-foreground hover:bg-background"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{subscriptionLabel}</p>
                  <p className="text-[0.82rem] text-[#74685c]">{monthlyUnlimitedLabel}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">€30/mo</p>
              </button>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <button
            type="button"
            onClick={onToggleMoreDetails}
            disabled={isActionBusy}
            className="flex min-h-[3.3rem] w-full items-center justify-between rounded-[1rem] bg-[#f4eee8] px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-[#eee5dd]"
          >
            <span>{showMoreDetails ? hideMoreDetailsLabel : addMoreDetailsLabel}</span>
            {showMoreDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showMoreDetails ? (
            <div className="space-y-3">
              <p className="max-w-[30rem] text-[0.92rem] leading-6 text-[#74685c]">{moreDetailsHint}</p>
              <CreateListingDynamicFieldsSection
                titleLabel={addMoreDetailsLabel}
                emptyLabel={moreDetailsEmptyLabel}
                categoryId={selectedCategoryId}
                templatesByCategory={templatesByCategory}
                initialValues={initialDynamicValues}
                locale={locale}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
