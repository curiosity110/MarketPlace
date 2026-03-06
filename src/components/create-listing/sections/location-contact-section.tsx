"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PHONE_COUNTRIES } from "@/lib/phone";
import type { CreateListingCity } from "@/components/create-listing/types";

type Props = {
  locationTitleLabel: string;
  detailsTitleLabel: string;
  cityLabel: string;
  cityHelperLabel: string;
  noCityAvailableLabel: string;
  countryLabel: string;
  phoneLabel: string;
  phonePlaceholder: string;
  acceptedPhoneFormatLabel: string;
  cityId: string;
  phoneCountry: string;
  phone: string;
  cities: CreateListingCity[];
  cityError: string | null;
  phoneError: string | null;
  isActiveStep: boolean;
  onCityChange: (value: string) => void;
  onPhoneCountryChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
};

export function CreateListingLocationContactSection({
  locationTitleLabel,
  detailsTitleLabel,
  cityLabel,
  cityHelperLabel,
  noCityAvailableLabel,
  countryLabel,
  phoneLabel,
  phonePlaceholder,
  acceptedPhoneFormatLabel,
  cityId,
  phoneCountry,
  phone,
  cities,
  cityError,
  phoneError,
  isActiveStep,
  onCityChange,
  onPhoneCountryChange,
  onPhoneChange,
}: Props) {
  return (
    <>
      <div
        className={`max-w-full min-w-0 space-y-4 rounded-2xl bg-card/80 p-4 ring-1 ring-border/60 sm:p-5 ${
          isActiveStep ? "ring-primary/30" : ""
        }`}
      >
        <h3 className="text-sm font-semibold tracking-tight">{locationTitleLabel}</h3>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">{cityLabel}</span>
          <Select
            name="cityId"
            value={cityId}
            onChange={(event) => onCityChange(event.target.value)}
            required
          >
            {cities.length === 0 ? (
              <option value="" disabled>
                {noCityAvailableLabel}
              </option>
            ) : (
              cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))
            )}
          </Select>
          <p className="text-xs text-muted-foreground">{cityHelperLabel}</p>
          {cityError ? <p className="text-xs font-medium text-destructive">{cityError}</p> : null}
        </label>
      </div>

      <div
        className={`max-w-full min-w-0 space-y-4 rounded-2xl bg-card/80 p-4 ring-1 ring-border/60 sm:p-5 ${
          isActiveStep ? "ring-primary/30" : ""
        }`}
      >
        <h3 className="text-sm font-semibold tracking-tight">{detailsTitleLabel}</h3>
        <div className="grid max-w-full min-w-0 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">{countryLabel}</span>
            <Select
              name="phoneCountry"
              value={phoneCountry}
              onChange={(event) => onPhoneCountryChange(event.target.value)}
            >
              {PHONE_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.label} (+{country.dialCode})
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium">{phoneLabel}</span>
            <Input
              name="phone"
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder={phonePlaceholder}
              required
              minLength={6}
              maxLength={20}
              inputMode="tel"
              autoComplete="tel"
            />
            {phoneError ? <p className="text-xs font-medium text-destructive">{phoneError}</p> : null}
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{acceptedPhoneFormatLabel}</p>
      </div>
    </>
  );
}
