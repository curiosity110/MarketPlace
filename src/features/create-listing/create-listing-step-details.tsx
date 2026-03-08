"use client";

import { ListingCondition } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { localizeCategoryName } from "@/lib/category-label";
import type {
  CreateListingCategoryOption,
  CreateListingCityOption,
} from "@/features/create-listing/types";

type Props = {
  locale: "en" | "mk";
  heading: string;
  titleLabel: string;
  titlePlaceholder: string;
  titleValue: string;
  categoryLabel: string;
  categorySearchPlaceholder: string;
  categorySearch: string;
  selectedCategoryId: string;
  categoryOptions: CreateListingCategoryOption[];
  noCategoryMatchLabel: string;
  categoryError: string | null;
  conditionLabel: string;
  condition: ListingCondition;
  conditionLabels: Record<ListingCondition, string>;
  cityLabel: string;
  cityId: string;
  cities: CreateListingCityOption[];
  noCityAvailableLabel: string;
  cityError: string | null;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionValue: string;
  isActionBusy: boolean;
  onTitleChange: (value: string) => void;
  onCategorySearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onConditionChange: (condition: ListingCondition) => void;
  onCityChange: (cityId: string) => void;
  onDescriptionChange: (value: string) => void;
};

export function CreateListingStepDetails({
  locale,
  heading,
  titleLabel,
  titlePlaceholder,
  titleValue,
  categoryLabel,
  categorySearchPlaceholder,
  categorySearch,
  selectedCategoryId,
  categoryOptions,
  noCategoryMatchLabel,
  categoryError,
  conditionLabel,
  condition,
  conditionLabels,
  cityLabel,
  cityId,
  cities,
  noCityAvailableLabel,
  cityError,
  descriptionLabel,
  descriptionPlaceholder,
  descriptionValue,
  isActionBusy,
  onTitleChange,
  onCategorySearchChange,
  onCategoryChange,
  onConditionChange,
  onCityChange,
  onDescriptionChange,
}: Props) {
  const filteredCategories = categorySearch
    ? categoryOptions.filter((category) =>
        localizeCategoryName(category, locale)
          .toLowerCase()
          .includes(categorySearch.toLowerCase()),
      )
    : categoryOptions;

  return (
    <section className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-[1.9rem] font-semibold tracking-[-0.045em] text-foreground">
          {heading}
        </h2>
      </div>

      <div className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">{titleLabel}</span>
          <Input
            name="title"
            value={titleValue}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder={titlePlaceholder}
            required
            disabled={isActionBusy}
            className="h-14 rounded-[1.25rem] border-0 bg-card/70 px-4 text-base shadow-none ring-1 ring-border/45"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">{categoryLabel}</span>
          <Input
            value={categorySearch}
            onChange={(event) => onCategorySearchChange(event.target.value)}
            placeholder={categorySearchPlaceholder}
            disabled={isActionBusy}
            className="h-14 rounded-[1.25rem] border-0 bg-card/70 px-4 text-base shadow-none ring-1 ring-border/45"
          />

          <div className="max-h-48 overflow-y-auto rounded-[1.35rem] bg-card/60 ring-1 ring-border/40">
            {filteredCategories.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">{noCategoryMatchLabel}</p>
            ) : (
              <div className="py-1.5">
                {filteredCategories.map((category) => {
                  const isSelected = category.id === selectedCategoryId;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        onCategoryChange(category.id);
                        onCategorySearchChange("");
                      }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-background/60 ${
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <span>{localizeCategoryName(category, locale)}</span>
                      {isSelected ? (
                        <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background">
                          {categoryLabel}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {categoryError ? <p className="text-sm text-destructive">{categoryError}</p> : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">{conditionLabel}</span>
            <Select
              name="condition"
              value={condition}
              onChange={(event) => onConditionChange(event.target.value as ListingCondition)}
              disabled={isActionBusy}
              className="h-14 rounded-[1.25rem] border-0 bg-card/70 px-4 text-base shadow-none ring-1 ring-border/45"
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

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">{cityLabel}</span>
            <Select
              name="cityId"
              value={cityId}
              onChange={(event) => onCityChange(event.target.value)}
              required
              disabled={isActionBusy}
              className="h-14 rounded-[1.25rem] border-0 bg-card/70 px-4 text-base shadow-none ring-1 ring-border/45"
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
            {cityError ? <p className="text-sm text-destructive">{cityError}</p> : null}
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">{descriptionLabel}</span>
          <Textarea
            name="description"
            value={descriptionValue}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder={descriptionPlaceholder}
            disabled={isActionBusy}
            maxLength={500}
            className="min-h-32 rounded-[1.35rem] border-0 bg-card/70 px-4 py-3 text-base shadow-none ring-1 ring-border/45"
          />
        </label>
      </div>
    </section>
  );
}
