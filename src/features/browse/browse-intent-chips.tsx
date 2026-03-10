"use client";

import * as React from "react";
import type { BrowseSearchIntent } from "@/features/browse/search-intent";
import type { BrowseFilterState } from "@/components/browse-filters.types";
import type { BrowseParentCategory, BrowseCity } from "@/features/browse/types";
import { cn } from "@/lib/utils";

export type IntentChip = {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
};

type Props = {
  locale: "en" | "mk";
  query: string;
  intent: BrowseSearchIntent;
  state: BrowseFilterState;
  dynamicValues: Record<string, string>;
  categories: BrowseParentCategory[];
  cities: BrowseCity[];
  onApply: (nextState: BrowseFilterState, nextDynamic?: Record<string, string>) => void;
};

function getIntentChips(
  locale: "en" | "mk",
  intent: BrowseSearchIntent,
  state: BrowseFilterState,
  dynamicValues: Record<string, string>,
  categories: BrowseParentCategory[],
  cities: BrowseCity[],
  onApply: (nextState: BrowseFilterState, nextDynamic?: Record<string, string>) => void,
): IntentChip[] {
  const chips: IntentChip[] = [];
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
  const tokens = intent.tokens;
  const q = norm(intent.rawQuery);

  const carsSlug = "cars";
  const carsCat = categories.find((c) => c.slug === carsSlug);
  const realEstateCat = categories.find((c) => c.slug === "real-estate");
  const electronicsCat = categories.find((c) => c.slug === "electronics");
  const jobsCat = categories.find((c) => c.slug === "jobs");

  const carTerms = ["bmw", "audi", "golf", "car", "cars", "auto", "vehicle", "mercedes", "volkswagen", "opel", "ford", "toyota", "sedan", "suv"];
  const isCarIntent = carsCat && (intent.inferredMakeSlug || carTerms.some((t) => q.includes(t)) || intent.inferredCategoryId === carsCat.id);

  const electronicsTerms = ["iphone", "samsung", "laptop", "phone", "macbook", "ipad", "tv", "tablet"];
  const isElectronicsIntent = electronicsCat && (electronicsTerms.some((t) => q.includes(t)) || intent.inferredCategoryId === electronicsCat.id);

  const realEstateTerms = ["apartment", "house", "rent", "studio", "flat", "property"];
  const isRealEstateIntent = realEstateCat && (realEstateTerms.some((t) => q.includes(t)) || intent.inferredCategoryId === realEstateCat.id);

  const jobTerms = ["job", "work", "developer", "waiter", "salary", "remote", "full-time", "part-time"];
  const isJobsIntent = jobsCat && (jobTerms.some((t) => q.includes(t)) || intent.inferredCategoryId === jobsCat.id);

  const isMk = locale === "mk";

  if (isCarIntent && carsCat) {
    const fuelChips = [
      { key: "fuel", value: "Petrol", label: "Petrol" },
      { key: "fuel", value: "Diesel", label: "Diesel" },
    ];
    fuelChips.forEach(({ key, value, label }) => {
      const active = dynamicValues[key] === value;
      chips.push({
        id: `car-${key}-${value}`,
        label,
        isActive: active,
        onSelect: () => onApply(state, { ...dynamicValues, [key]: active ? "" : value }),
      });
    });
    chips.push({
      id: "car-max-5k",
      label: isMk ? "Под 5000€" : "Under 5000€",
      isActive: state.max === "300000",
      onSelect: () => onApply({ ...state, max: state.max === "300000" ? "" : "300000" }),
    });
    chips.push({
      id: "car-year-2015-2020",
      label: "2015-2020",
      isActive: state.yearFrom === "2015" && state.yearTo === "2020",
      onSelect: () =>
        onApply({
          ...state,
          yearFrom: state.yearFrom === "2015" ? "" : "2015",
          yearTo: state.yearTo === "2020" ? "" : "2020",
        }),
    });
    chips.push({
      id: "car-trans-manual",
      label: isMk ? "Мануелно" : "Manual",
      isActive: dynamicValues.transmission === "Manual",
      onSelect: () => onApply(state, { ...dynamicValues, transmission: dynamicValues.transmission === "Manual" ? "" : "Manual" }),
    });
    chips.push({
      id: "car-trans-auto",
      label: isMk ? "Автоматско" : "Automatic",
      isActive: dynamicValues.transmission === "Automatic",
      onSelect: () => onApply(state, { ...dynamicValues, transmission: dynamicValues.transmission === "Automatic" ? "" : "Automatic" }),
    });
  }

  if (isElectronicsIntent) {
    chips.push({
      id: "el-condition-new",
      label: isMk ? "Ново" : "New",
      isActive: state.condition === "NEW",
      onSelect: () => onApply({ ...state, condition: state.condition === "NEW" ? "" : "NEW" }),
    });
    chips.push({
      id: "el-condition-used",
      label: isMk ? "Користено" : "Used",
      isActive: state.condition === "USED",
      onSelect: () => onApply({ ...state, condition: state.condition === "USED" ? "" : "USED" }),
    });
    chips.push({
      id: "el-max-300",
      label: isMk ? "Под 300€" : "Under 300€",
      isActive: state.max === "20000",
      onSelect: () => onApply({ ...state, max: state.max === "20000" ? "" : "20000" }),
    });
    chips.push({
      id: "el-warranty",
      label: isMk ? "Со гаранција" : "With warranty",
      isActive: dynamicValues.warranty === "1" || dynamicValues.warranty === "true",
      onSelect: () =>
        onApply(state, {
          ...dynamicValues,
          warranty: dynamicValues.warranty ? "" : "1",
        }),
    });
  }

  if (isRealEstateIntent && realEstateCat) {
    const rentChild = realEstateCat.children.find((c) => c.slug?.includes("apartment") || c.slug === "real-estate-apartments");
    chips.push({
      id: "re-rent",
      label: isMk ? "Наем" : "Rent",
      isActive: dynamicValues.deal === "rent" || state.cat === rentChild?.id,
      onSelect: () =>
        onApply(
          { ...state, cat: realEstateCat.id, sub: rentChild?.id ?? "" },
          { ...dynamicValues, deal: "rent" },
        ),
    });
    chips.push({
      id: "re-buy",
      label: isMk ? "Купіва" : "Buy",
      isActive: dynamicValues.deal === "sale",
      onSelect: () => onApply(state, { ...dynamicValues, deal: "sale" }),
    });
    chips.push({
      id: "re-1room",
      label: "1 room",
      isActive: dynamicValues.rooms === "1",
      onSelect: () => onApply(state, { ...dynamicValues, rooms: dynamicValues.rooms === "1" ? "" : "1" }),
    });
    chips.push({
      id: "re-2rooms",
      label: "2 rooms",
      isActive: dynamicValues.rooms === "2",
      onSelect: () => onApply(state, { ...dynamicValues, rooms: dynamicValues.rooms === "2" ? "" : "2" }),
    });
    const skopje = cities.find((c) => norm(c.name).includes("skopje"));
    const ohrid = cities.find((c) => norm(c.name).includes("ohrid"));
    if (skopje) {
      chips.push({
        id: "re-city-skopje",
        label: "Skopje",
        isActive: state.city === skopje.id,
        onSelect: () => onApply({ ...state, city: state.city === skopje.id ? "" : skopje.id }),
      });
    }
    if (ohrid) {
      chips.push({
        id: "re-city-ohrid",
        label: "Ohrid",
        isActive: state.city === ohrid.id,
        onSelect: () => onApply({ ...state, city: state.city === ohrid.id ? "" : ohrid.id }),
      });
    }
  }

  if (isJobsIntent && jobsCat) {
    chips.push({
      id: "job-ft",
      label: isMk ? "Полно работно време" : "Full-time",
      isActive: dynamicValues.contract === "Full-time",
      onSelect: () => onApply(state, { ...dynamicValues, contract: dynamicValues.contract === "Full-time" ? "" : "Full-time" }),
    });
    chips.push({
      id: "job-pt",
      label: isMk ? "Скратено" : "Part-time",
      isActive: dynamicValues.contract === "Part-time",
      onSelect: () => onApply(state, { ...dynamicValues, contract: dynamicValues.contract === "Part-time" ? "" : "Part-time" }),
    });
    chips.push({
      id: "job-remote",
      label: "Remote",
      isActive: dynamicValues.remote === "true" || dynamicValues.remote === "1",
      onSelect: () => onApply(state, { ...dynamicValues, remote: dynamicValues.remote ? "" : "true" }),
    });
    const skopje = cities.find((c) => norm(c.name).includes("skopje"));
    if (skopje) {
      chips.push({
        id: "job-city-skopje",
        label: "Skopje",
        isActive: state.city === skopje.id,
        onSelect: () => onApply({ ...state, city: state.city === skopje.id ? "" : skopje.id }),
      });
    }
  }

  return chips;
}

export function BrowseIntentChips({
  locale,
  query,
  intent,
  state,
  dynamicValues,
  categories,
  cities,
  onApply,
}: Props) {
  const chips = React.useMemo(
    () => getIntentChips(locale, intent, state, dynamicValues, categories, cities, onApply),
    [locale, intent, state, dynamicValues, categories, cities, onApply],
  );

  if (!query.trim() || chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onSelect}
          className={cn(
            "inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium transition-colors",
            chip.isActive
              ? "bg-orange-500 text-white shadow-sm"
              : "bg-muted/50 text-muted-foreground ring-1 ring-border/50 hover:bg-muted hover:text-foreground",
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
