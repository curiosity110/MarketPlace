"use client";

import { ListingCondition } from "@prisma/client";
import { CreateListingDynamicFieldsSection } from "@/components/create-listing/sections/dynamic-fields-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { localizeCategoryName } from "@/lib/category-label";
import type {
  CreateListingCategoryOption,
  CreateListingCityOption,
  CreateListingTemplateMap,
} from "@/features/create-listing/types";

type Props = {
  locale: "en" | "mk";
  heading: string;
  titleLabel: string;
  titlePlaceholder: string;
  titleValue: string;
  titleError: string | null;
  categoryLabel: string;
  categorySearchPlaceholder: string;
  categorySearch: string;
  selectedCategoryId: string;
  categoryOptions: CreateListingCategoryOption[];
  selectedCategoryLabel: string | null;
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
  identityFieldsLabel: string;
  identityFieldsHint: string;
  identityFieldsEmptyLabel: string;
  primaryTemplateKeys: string[];
  templatesByCategory: CreateListingTemplateMap;
  dynamicValues: Record<string, string>;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionValue: string;
  isActionBusy: boolean;
  onTitleChange: (value: string) => void;
  onCategorySearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string, label: string) => void;
  onConditionChange: (condition: ListingCondition) => void;
  onCityChange: (cityId: string) => void;
  onDynamicValuesChange: (values: Record<string, string>) => void;
  onDescriptionChange: (value: string) => void;
};

export function CreateListingStepDetails({
  locale,
  heading,
  titleLabel,
  titlePlaceholder,
  titleValue,
  titleError,
  categoryLabel,
  categorySearchPlaceholder,
  categorySearch,
  selectedCategoryId,
  categoryOptions,
  selectedCategoryLabel,
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
  identityFieldsLabel,
  identityFieldsHint,
  identityFieldsEmptyLabel,
  primaryTemplateKeys,
  templatesByCategory,
  dynamicValues,
  descriptionLabel,
  descriptionPlaceholder,
  descriptionValue,
  isActionBusy,
  onTitleChange,
  onCategorySearchChange,
  onCategoryChange,
  onConditionChange,
  onCityChange,
  onDynamicValuesChange,
  onDescriptionChange,
}: Props) {
  return (
    <section className="space-y-8">
      <div className="max-w-[30rem] space-y-2">
        <h2 className="text-[1.85rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[1.95rem]">
          {heading}
        </h2>
      </div>

      <div className="space-y-6">
        <label className="block space-y-2.5">
          <span className="text-[0.95rem] font-medium text-foreground">{titleLabel}</span>
          <Input
            name="title"
            value={titleValue}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder={titlePlaceholder}
            required
            disabled={isActionBusy}
            className="h-[3.6rem] rounded-[1.05rem] border-0 bg-[#ece7e1] px-[1.125rem] text-base shadow-none ring-0 placeholder:text-[#8a7d72]"
          />
          {titleError ? <p className="text-sm text-destructive">{titleError}</p> : null}
        </label>

        <div className="space-y-2.5">
          <span className="text-[0.95rem] font-medium text-foreground">{categoryLabel}</span>
          <Input
            value={categorySearch}
            onChange={(event) => onCategorySearchChange(event.target.value)}
            placeholder={categorySearchPlaceholder}
            disabled={isActionBusy}
            className="h-[3.6rem] rounded-[1.05rem] border-0 bg-[#ece7e1] px-[1.125rem] text-base shadow-none ring-0 placeholder:text-[#8a7d72]"
          />

          {selectedCategoryLabel ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex min-h-9 items-center rounded-full bg-[#f2ebe4] px-3.5 py-1.5 text-sm text-[#4f4338] ring-1 ring-[#dfd4c7]">
                {selectedCategoryLabel}
              </span>
            </div>
          ) : null}

          <div className="max-h-60 overflow-y-auto rounded-[1.05rem] bg-[#f6f2ed] py-2">
            {categoryOptions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[#74685c]">{noCategoryMatchLabel}</p>
            ) : (
              categoryOptions.slice(0, 8).map((category) => {
                const isSelected = category.id === selectedCategoryId;
                const label = localizeCategoryName(category, locale);

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onCategoryChange(category.id, label)}
                    className={`flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-background/50 ${
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span className="pr-2 leading-5">{label}</span>
                    {isSelected ? (
                      <span className="shrink-0 rounded-full bg-[#2e241d] px-2.5 py-1 text-[11px] font-medium text-[#f8f1e7]">
                        •
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          {categoryError ? <p className="text-sm text-destructive">{categoryError}</p> : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2.5">
            <span className="text-[0.95rem] font-medium text-foreground">{conditionLabel}</span>
            <Select
              name="condition"
              value={condition}
              onChange={(event) => onConditionChange(event.target.value as ListingCondition)}
              disabled={isActionBusy}
              className="h-[3.6rem] rounded-[1.05rem] border-0 bg-[#ece7e1] px-4 text-base shadow-none ring-0"
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

          <label className="block space-y-2.5">
            <span className="text-[0.95rem] font-medium text-foreground">{cityLabel}</span>
            <Select
              name="cityId"
              value={cityId}
              onChange={(event) => onCityChange(event.target.value)}
              required
              disabled={isActionBusy}
              className="h-[3.6rem] rounded-[1.05rem] border-0 bg-[#ece7e1] px-4 text-base shadow-none ring-0"
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

        {selectedCategoryId && primaryTemplateKeys.length > 0 ? (
          <div className="space-y-2.5 rounded-[1.05rem] bg-[#f6f2ed] px-4 py-4">
            <div className="space-y-1">
              <p className="text-[0.95rem] font-medium text-foreground">{identityFieldsLabel}</p>
              <p className="text-sm leading-5 text-[#74685c]">{identityFieldsHint}</p>
            </div>
            <CreateListingDynamicFieldsSection
              titleLabel=""
              emptyLabel={identityFieldsEmptyLabel}
              categoryId={selectedCategoryId}
              templatesByCategory={templatesByCategory}
              initialValues={dynamicValues}
              locale={locale}
              visibleTemplateKeys={primaryTemplateKeys}
              includeFormNames={false}
              onValuesChange={onDynamicValuesChange}
              compact
              showHeader={false}
            />
          </div>
        ) : null}

        <label className="block space-y-2.5">
          <span className="text-[0.95rem] font-medium text-foreground">{descriptionLabel}</span>
          <Textarea
            name="description"
            value={descriptionValue}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder={descriptionPlaceholder}
            disabled={isActionBusy}
            maxLength={500}
            className="min-h-[8.75rem] rounded-[1.05rem] border-0 bg-[#ece7e1] px-[1.125rem] py-3.5 text-base leading-6 shadow-none ring-0 placeholder:text-[#8a7d72]"
          />
        </label>
      </div>
    </section>
  );
}
