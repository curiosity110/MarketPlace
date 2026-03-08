"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrowseFilterSheet } from "@/features/browse/browse-filter-sheet";
import { BrowseSearch } from "@/features/browse/browse-search-new";
import type {
  BrowseCarMake,
  BrowseCity,
  BrowseFilterState,
  BrowseParentCategory,
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
  shouldSkipBrowseNavigation,
} from "@/components/browse-filters.utils";

type BrowseToolbarNewProps = {
  locale: "en" | "mk";
  searchPlaceholder: string;
  categories: BrowseParentCategory[];
  cities: BrowseCity[];
  templatesByCategory: Record<string, BrowseTemplate[]>;
  carMakes: BrowseCarMake[];
  canUseFavoritesFilter: boolean;
};

export function BrowseToolbarNew({
  locale,
  searchPlaceholder,
  categories,
  cities,
  templatesByCategory,
  carMakes,
  canUseFavoritesFilter,
}: BrowseToolbarNewProps) {
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

  return (
    <>
      <BrowseSearch
        searchValue={state.q}
        onSearchChange={(value) => setState((prev) => ({ ...prev, q: value }))}
        onFilterClick={() => setIsSheetOpen(true)}
      />

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
