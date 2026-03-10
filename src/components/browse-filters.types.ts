import type { CategoryFieldType } from "@prisma/client";
import type React from "react";

export type BrowseTemplate = {
  key: string;
  label: string;
  type: CategoryFieldType;
  options: string[];
};

export type BrowseParentCategory = {
  id: string;
  slug: string;
  name: string;
  children: { id: string; slug: string; name: string }[];
};

export type BrowseCity = { id: string; name: string };

export type BrowseCarMake = {
  id: string;
  name: string;
  slug: string;
  models: {
    id: string;
    name: string;
    slug: string;
    makeId: string;
  }[];
};

export type BrowseSort = "newest" | "price-asc" | "price-desc";

export type BrowseFilterState = {
  q: string;
  cat: string;
  sub: string;
  city: string;
  condition: string;
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  fav: string;
  min: string;
  max: string;
  sort: BrowseSort;
};

export type BuildBrowseQueryOptions = {
  omitSortParamWhenNewest?: boolean;
};

export type BrowseFiltersMode = "desktop" | "mobile";

export type BrowseFiltersProps = {
  categories: BrowseParentCategory[];
  cities: BrowseCity[];
  templatesByCategory: Record<string, BrowseTemplate[]>;
  carMakes: BrowseCarMake[];
  locale?: "en" | "mk";
  canUseFavoritesFilter?: boolean;
  showActiveChips?: boolean;
  mode?: BrowseFiltersMode;
  value?: BrowseFilterState;
  dynamicValues?: Record<string, string>;
  onChange?: React.Dispatch<React.SetStateAction<BrowseFilterState>>;
  onDynamicValuesChange?: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  onApply?: (
    nextState: BrowseFilterState,
    nextDynamicValues: Record<string, string>,
  ) => void;
  showResetButton?: boolean;
  inferredCategoryId?: string;
  inferredSubcategoryId?: string;
  inferredCategoryConfidence?: "low" | "medium" | "high";
};

export type BrowseActiveFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};
