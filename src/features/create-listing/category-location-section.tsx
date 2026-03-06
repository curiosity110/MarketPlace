"use client";

import { FormBlock } from "@/components/ui/layout";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { localizeCategoryName } from "@/lib/category-label";
import type {
  CreateListingCategoryOption,
  CreateListingCityOption,
} from "@/features/create-listing/types";

type Props = {
  title: string;
  description: string;
  categoryLabel: string;
  categorySearchLabel: string;
  categorySearchPlaceholder: string;
  categoryRequiredLabel: string;
  noCategoryMatchLabel: string;
  cityLabel: string;
  noCityAvailableLabel: string;
  categorySearch: string;
  selectedCategoryId: string;
  categoryOptions: CreateListingCategoryOption[];
  categoryError: string | null;
  cityId: string;
  cityError: string | null;
  cities: CreateListingCityOption[];
  locale: "en" | "mk";
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCityChange: (value: string) => void;
};

export function CategoryLocationSection({
  title,
  description,
  categoryLabel,
  categorySearchLabel,
  categorySearchPlaceholder,
  categoryRequiredLabel,
  noCategoryMatchLabel,
  cityLabel,
  noCityAvailableLabel,
  categorySearch,
  selectedCategoryId,
  categoryOptions,
  categoryError,
  cityId,
  cityError,
  cities,
  locale,
  onSearchChange,
  onCategoryChange,
  onCityChange,
}: Props) {
  return (
    <FormBlock title={title} description={description}>
      <div className="grid gap-3">
        <label className="space-y-1.5">
          <span className="text-sm font-medium">{categorySearchLabel}</span>
          <Input
            value={categorySearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={categorySearchPlaceholder}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">{categoryLabel}</span>
            <Select
              name="categoryId"
              value={selectedCategoryId}
              onChange={(event) => onCategoryChange(event.target.value)}
              required
            >
              <option value="" disabled>
                {categoryRequiredLabel}
              </option>
              {categoryOptions.length === 0 ? (
                <option value="" disabled>
                  {noCategoryMatchLabel}
                </option>
              ) : (
                categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {localizeCategoryName(category, locale)}
                  </option>
                ))
              )}
            </Select>
            {categoryError ? (
              <p className="text-sm text-destructive">{categoryError}</p>
            ) : null}
          </label>

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
            {cityError ? <p className="text-sm text-destructive">{cityError}</p> : null}
          </label>
        </div>
      </div>
    </FormBlock>
  );
}
