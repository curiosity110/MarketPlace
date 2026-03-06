"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { BrowseFilterSheet } from "@/features/browse/browse-filter-sheet";
import { BrowseSearch } from "@/features/browse/browse-search";
import type {
  BrowseCarMake,
  BrowseCity,
  BrowseFilterState,
  BrowseParentCategory,
  BrowseSort,
  BrowseTemplate,
} from "@/features/browse/types";
import { useDebouncedValue } from "@/components/browse-filters.hooks";
import {
  TYPING_DEBOUNCE_MS,
  areBrowseStatesEqual,
  areStringRecordsEqual,
  buildBrowseQueryFromState,
  getBrowseDynamicValues,
  getBrowseFilterState,
  parseBrowseSort,
  shouldSkipBrowseNavigation,
} from "@/components/browse-filters.utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Props = {
  locale: "en" | "mk";
  searchLabel: string;
  searchPlaceholder: string;
  sortLabel: string;
  filtersLabel: string;
  categories: BrowseParentCategory[];
  cities: BrowseCity[];
  templatesByCategory: Record<string, BrowseTemplate[]>;
  carMakes: BrowseCarMake[];
  canUseFavoritesFilter: boolean;
  activeFilterCount: number;
};

export function BrowseToolbar({
  locale,
  searchLabel,
  searchPlaceholder,
  sortLabel,
  filtersLabel,
  categories,
  cities,
  templatesByCategory,
  carMakes,
  canUseFavoritesFilter,
  activeFilterCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spString = searchParams.toString();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [state, setState] = React.useState<BrowseFilterState>(() =>
    getBrowseFilterState(new URLSearchParams(spString)),
  );
  const [dynamicValues, setDynamicValues] = React.useState<Record<string, string>>(() =>
    getBrowseDynamicValues(new URLSearchParams(spString)),
  );

  React.useEffect(() => {
    const latest = new URLSearchParams(spString);
    const nextState = getBrowseFilterState(latest);
    const nextDynamicValues = getBrowseDynamicValues(latest);

    setState((prev) => (areBrowseStatesEqual(prev, nextState) ? prev : nextState));
    setDynamicValues((prev) =>
      areStringRecordsEqual(prev, nextDynamicValues) ? prev : nextDynamicValues,
    );
  }, [spString]);

  const applyState = React.useCallback(
    (
      nextState: BrowseFilterState = state,
      nextDynamicValues: Record<string, string> = dynamicValues,
      closeSheet = false,
    ) => {
      const { query } = buildBrowseQueryFromState(spString, nextState, nextDynamicValues);
      if (!shouldSkipBrowseNavigation(query, spString)) {
        router.replace(query ? `/browse?${query}` : "/browse", { scroll: false });
      }
      if (closeSheet) setIsSheetOpen(false);
    },
    [dynamicValues, router, spString, state],
  );

  const debouncedSearch = useDebouncedValue(state.q, TYPING_DEBOUNCE_MS);

  React.useEffect(() => {
    const nextState = { ...state, q: debouncedSearch };
    applyState(nextState, dynamicValues);
  }, [applyState, debouncedSearch, dynamicValues, state]);

  const sortOptions: Array<{ value: BrowseSort; label: string }> =
    locale === "mk"
      ? [
          { value: "newest", label: "Најнови" },
          { value: "price-asc", label: "Цена: ниска кон висока" },
          { value: "price-desc", label: "Цена: висока кон ниска" },
        ]
      : [
          { value: "newest", label: "Newest" },
          { value: "price-asc", label: "Price: low to high" },
          { value: "price-desc", label: "Price: high to low" },
        ];

  return (
    <>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_210px_auto] md:items-center">
        <BrowseSearch
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={state.q}
          onChange={(value) => setState((prev) => ({ ...prev, q: value }))}
        />

        <label className="block min-w-0">
          <span className="sr-only">{sortLabel}</span>
          <Select
            value={state.sort}
            onChange={(event) => {
              const nextState = {
                ...state,
                sort: parseBrowseSort(event.target.value),
              };
              setState(nextState);
              applyState(nextState, dynamicValues);
            }}
            className="h-12 rounded-2xl bg-card"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>

        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-2xl px-4 md:w-auto"
          onClick={() => setIsSheetOpen(true)}
        >
          <SlidersHorizontal size={16} className="mr-2" />
          {filtersLabel}
          {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      <BrowseFilterSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        locale={locale}
        categories={categories}
        cities={cities}
        carMakes={carMakes}
        templatesByCategory={templatesByCategory}
        canUseFavoritesFilter={canUseFavoritesFilter}
        value={state}
        dynamicValues={dynamicValues}
        onChange={setState}
        onDynamicValuesChange={setDynamicValues}
        onApply={() => applyState(state, dynamicValues, true)}
      />
    </>
  );
}
