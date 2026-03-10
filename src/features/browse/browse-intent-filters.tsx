"use client";

import * as React from "react";
import type { BrowseFilterState } from "@/components/browse-filters.types";
import type { BrowseCarMake, BrowseCity, BrowseParentCategory } from "@/features/browse/types";
import type { IntentFilterSuggestion } from "@/features/browse/search-intent";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ListingCondition } from "@prisma/client";
import { localizeCategoryName } from "@/lib/category-label";
import { cn } from "@/lib/utils";

type Props = {
  locale: "en" | "mk";
  suggestion: IntentFilterSuggestion;
  state: BrowseFilterState;
  dynamicValues: Record<string, string>;
  categories: BrowseParentCategory[];
  cities: BrowseCity[];
  carMakes: BrowseCarMake[];
  onChange: (nextState: BrowseFilterState, nextDynamic?: Record<string, string>) => void;
};

const CONDITION_OPTIONS: { value: ListingCondition; labelEn: string; labelMk: string }[] = [
  { value: "USED", labelEn: "Used", labelMk: "Користено" },
  { value: "NEW", labelEn: "New", labelMk: "Ново" },
  { value: "REFURBISHED", labelEn: "Refurbished", labelMk: "Рефурбиширано" },
];

export function BrowseIntentFilters({
  locale,
  suggestion,
  state,
  dynamicValues,
  categories,
  cities,
  carMakes,
  onChange,
}: Props) {
  const isMk = locale === "mk";
  const displayCategoryId = state.cat || state.sub || suggestion.suggestedCategoryId || suggestion.suggestedSubcategoryId || "";
  const displayMake = state.make || suggestion.suggestedMakeSlug || "";
  const displayModel = state.model || suggestion.suggestedModelSlug || "";
  const displayCity = state.city || suggestion.suggestedCityId || "";

  const selectedMake = carMakes.find((m) => m.slug === displayMake);
  const models = selectedMake?.models ?? [];

  const handleCategoryChange = (value: string) => {
    const parent = categories.find((p) => p.id === value || p.children.some((c) => c.id === value));
    const isChild = parent?.children.some((c) => c.id === value);
    onChange({
      ...state,
      cat: parent && !isChild ? value : (parent?.id ?? ""),
      sub: isChild ? value : "",
      make: "",
      model: "",
      yearFrom: "",
      yearTo: "",
    });
  };

  const handleMakeChange = (makeSlug: string) => {
    onChange({
      ...state,
      make: makeSlug,
      model: "",
      yearFrom: "",
      yearTo: "",
    });
  };

  const handleModelChange = (modelSlug: string) => {
    onChange({ ...state, model: modelSlug });
  };

  const handleCityChange = (cityId: string) => {
    onChange({ ...state, city: cityId });
  };

  const handleConditionChange = (condition: string) => {
    onChange({ ...state, condition: condition || "" });
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...state, min: e.target.value.replace(/\D/g, "").slice(0, 10) });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...state, max: e.target.value.replace(/\D/g, "").slice(0, 10) });
  };

  const handleYearFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...state, yearFrom: e.target.value.replace(/\D/g, "").slice(0, 4) });
  };

  const handleYearToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...state, yearTo: e.target.value.replace(/\D/g, "").slice(0, 4) });
  };

  const hasAny =
    suggestion.showCategory ||
    suggestion.showMake ||
    suggestion.showModel ||
    suggestion.showYearRange ||
    suggestion.showPriceRange ||
    suggestion.showCondition ||
    suggestion.showCity ||
    suggestion.showFuel;

  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
      {suggestion.showCategory && (
        <div className="min-w-[120px]">
          <Select
            value={displayCategoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            aria-label={isMk ? "Категорија" : "Category"}
          >
            <option value="">{isMk ? "Сите" : "All"}</option>
            {categories.map((p) => (
              <React.Fragment key={p.id}>
                <option value={p.id}>{localizeCategoryName(p, locale)}</option>
                {p.children.map((c) => (
                  <option key={c.id} value={c.id}>
                    — {localizeCategoryName(c, locale)}
                  </option>
                ))}
              </React.Fragment>
            ))}
          </Select>
        </div>
      )}

      {suggestion.showMake && (
        <div className="min-w-[110px]">
          <Select
            value={displayMake}
            onChange={(e) => handleMakeChange(e.target.value)}
            aria-label={isMk ? "Марка" : "Make"}
          >
            <option value="">{isMk ? "Сите" : "All"}</option>
            {carMakes.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {suggestion.showModel && (
        <div className="min-w-[110px]">
          <Select
            value={displayModel}
            onChange={(e) => handleModelChange(e.target.value)}
            aria-label={isMk ? "Модел" : "Model"}
            disabled={!displayMake}
          >
            <option value="">{isMk ? "Сите" : "All"}</option>
            {models.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {suggestion.showYearRange && (
        <div className="flex items-center gap-1.5">
          <Input
            type="text"
            inputMode="numeric"
            placeholder={isMk ? "Од" : "From"}
            value={state.yearFrom}
            onChange={handleYearFromChange}
            className="h-9 w-20 text-sm"
            aria-label={isMk ? "Година од" : "Year from"}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={isMk ? "До" : "To"}
            value={state.yearTo}
            onChange={handleYearToChange}
            className="h-9 w-20 text-sm"
            aria-label={isMk ? "Година до" : "Year to"}
          />
        </div>
      )}

      {suggestion.showPriceRange && (
        <div className="flex items-center gap-1.5">
          <Input
            type="text"
            inputMode="numeric"
            placeholder={isMk ? "Мин" : "Min"}
            value={state.min}
            onChange={handleMinChange}
            className="h-9 w-24 text-sm"
            aria-label={isMk ? "Минимална цена" : "Min price"}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={isMk ? "Макс" : "Max"}
            value={state.max}
            onChange={handleMaxChange}
            className="h-9 w-24 text-sm"
            aria-label={isMk ? "Максимална цена" : "Max price"}
          />
          <span className="text-[11px] text-muted-foreground">MKD</span>
        </div>
      )}

      {suggestion.showCondition && (
        <div className="min-w-[100px]">
          <Select
            value={state.condition}
            onChange={(e) => handleConditionChange(e.target.value)}
            aria-label={isMk ? "Состојба" : "Condition"}
          >
            <option value="">{isMk ? "Сите" : "Any"}</option>
            {CONDITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {isMk ? opt.labelMk : opt.labelEn}
              </option>
            ))}
          </Select>
        </div>
      )}

      {suggestion.showCity && (
        <div className="min-w-[120px]">
          <Select
            value={displayCity}
            onChange={(e) => handleCityChange(e.target.value)}
            aria-label={isMk ? "Град" : "City"}
          >
            <option value="">{isMk ? "Сите" : "All"}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {suggestion.showFuel && (
        <div className="min-w-[100px]">
          <Select
            value={dynamicValues.fuel ?? ""}
            onChange={(e) => onChange(state, { ...dynamicValues, fuel: e.target.value })}
            aria-label={isMk ? "Гориво" : "Fuel"}
          >
            <option value="">{isMk ? "Сите" : "All"}</option>
            <option value="Petrol">{isMk ? "Бензин" : "Petrol"}</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Electric">{isMk ? "Електричен" : "Electric"}</option>
          </Select>
        </div>
      )}
    </div>
  );
}
