"use client";

import type { ReactNode } from "react";
import { FormBlock } from "@/components/ui/layout";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PHONE_COUNTRIES } from "@/lib/phone";

type Props = {
  title: string;
  description: string;
  countryLabel: string;
  phoneLabel: string;
  phonePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  phoneCountry: string;
  phone: string;
  phoneError: string | null;
  descriptionValue: string;
  detailsNode?: ReactNode;
  onPhoneCountryChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

export function ContactDescriptionSection({
  title,
  description,
  countryLabel,
  phoneLabel,
  phonePlaceholder,
  descriptionLabel,
  descriptionPlaceholder,
  phoneCountry,
  phone,
  phoneError,
  descriptionValue,
  detailsNode,
  onPhoneCountryChange,
  onPhoneChange,
  onDescriptionChange,
}: Props) {
  return (
    <FormBlock title={title} description={description}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
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
            {phoneError ? <p className="text-sm text-destructive">{phoneError}</p> : null}
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="text-sm font-medium">{descriptionLabel}</span>
          <Textarea
            name="description"
            value={descriptionValue}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={5}
            className="min-h-[144px]"
            placeholder={descriptionPlaceholder}
          />
        </label>

        {detailsNode ? <div className="space-y-3">{detailsNode}</div> : null}
      </div>
    </FormBlock>
  );
}
