"use client";

import type { CreateListingCategory } from "@/components/create-listing/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { localizeCategoryName } from "@/lib/category-label";

type Props = {
  titleLabel: string;
  categoryLabel: string;
  categorySearchLabel: string;
  categorySearchPlaceholder: string;
  categoryRequiredLabel: string;
  noCategoryMatchLabel: string;
  categorySearch: string;
  selectedCategoryId: string;
  categoryOptions: CreateListingCategory[];
  categoryError: string | null;
  locale: "en" | "mk";
  isActiveStep: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

export function CreateListingCategorySection({
  titleLabel,
  categoryLabel,
  categorySearchLabel,
  categorySearchPlaceholder,
  categoryRequiredLabel,
  noCategoryMatchLabel,
  categorySearch,
  selectedCategoryId,
  categoryOptions,
  categoryError,
  locale,
  isActiveStep,
  onSearchChange,
  onCategoryChange,
}: Props) {
  void isActiveStep;
  return (
    <div className="max-w-full min-w-0 space-y-4">
      <h3 className="text-sm font-semibold tracking-tight">{titleLabel}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium">{categorySearchLabel}</span>
          <Input
            value={categorySearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={categorySearchPlaceholder}
          />
        </label>
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
            <p className="text-xs font-medium text-destructive">{categoryError}</p>
          ) : null}
        </label>
      </div>
    </div>
  );
}
