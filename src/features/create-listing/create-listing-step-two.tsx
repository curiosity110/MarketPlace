"use client";

import { Currency, ListingCondition } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CreateListingCityOption } from "@/features/create-listing/types";

type Props = {
  priceLabel: string;
  pricePlaceholder: string;
  currencyLabel: string;
  conditionLabel: string;
  cityLabel: string;
  noCityAvailableLabel: string;
  priceValue: string;
  currency: Currency;
  condition: ListingCondition;
  conditionLabels: Record<ListingCondition, string>;
  cityId: string;
  cities: CreateListingCityOption[];
  priceError: string | null;
  cityError: string | null;
  isActionBusy: boolean;
  onPriceChange: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onConditionChange: (condition: ListingCondition) => void;
  onCityChange: (cityId: string) => void;
};

export function CreateListingStepTwo({
  priceLabel,
  pricePlaceholder,
  currencyLabel,
  conditionLabel,
  cityLabel,
  noCityAvailableLabel,
  priceValue,
  currency,
  condition,
  conditionLabels,
  cityId,
  cities,
  priceError,
  cityError,
  isActionBusy,
  onPriceChange,
  onCurrencyChange,
  onConditionChange,
  onCityChange,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {priceLabel}
          </span>
          <div className="flex gap-2">
            <Input
              name="price"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={priceValue}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder={pricePlaceholder}
              required
              disabled={isActionBusy}
              className="h-12 flex-1"
            />
            <Select
              name="currency"
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
              disabled={isActionBusy}
              className="h-12 w-28"
            >
              <option value={Currency.MKD}>MKD</option>
              <option value={Currency.EUR}>EUR</option>
            </Select>
          </div>
          {priceError && <p className="text-xs text-destructive">{priceError}</p>}
        </label>
      </div>

      <div>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {conditionLabel}
          </span>
          <Select
            name="condition"
            value={condition}
            onChange={(e) => onConditionChange(e.target.value as ListingCondition)}
            disabled={isActionBusy}
            className="h-12"
          >
            <option value={ListingCondition.NEW}>
              {conditionLabels[ListingCondition.NEW]}
            </option>
            <option value={ListingCondition.USED}>
              {conditionLabels[ListingCondition.USED]}
            </option>
            <option value={ListingCondition.REFURBISHED}>
              {conditionLabels[ListingCondition.REFURBISHED]}
            </option>
          </Select>
        </label>
      </div>

      <div>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {cityLabel}
          </span>
          <Select
            name="cityId"
            value={cityId}
            onChange={(e) => onCityChange(e.target.value)}
            required
            disabled={isActionBusy}
            className="h-12"
          >
            {cities.length === 0 ? (
              <option disabled>{noCityAvailableLabel}</option>
            ) : (
              <>
                <option value="">{cityLabel}</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </>
            )}
          </Select>
          {cityError && <p className="text-xs text-destructive">{cityError}</p>}
        </label>
      </div>
    </div>
  );
}
