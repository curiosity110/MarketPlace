"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { BrowseCategoryTabs } from "@/features/browse/browse-category-tabs";
import { BrowseFilterSheet } from "@/features/browse/browse-filter-sheet";
import { BrowseSearch } from "@/features/browse/browse-search";
import type {
  BrowseCarMake,
  BrowseCity,
  BrowseFilterState,
  BrowseParentCategory,
  BrowseTemplate,
} from "@/features/browse/types";

type Props = {
  locale: "en" | "mk";
  searchPlaceholder: string;
  filterLabel: string;
  allLabel: string;
  categories: BrowseParentCategory[];
  cities: BrowseCity[];
  templatesByCategory: Record<string, BrowseTemplate[]>;
  carMakes: BrowseCarMake[];
  canUseFavoritesFilter: boolean;
  totalCount: number;
  resultsLabel: string;
};

export function BrowseHeader({
  locale,
  searchPlaceholder,
  filterLabel,
  allLabel,
  categories,
  cities,
  templatesByCategory,
  carMakes,
  canUseFavoritesFilter,
  totalCount,
  resultsLabel,
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
  const latestStateRef = React.useRef(state);
  const latestDynamicValuesRef = React.useRef(dynamicValues);

  React.useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    latestDynamicValuesRef.current = dynamicValues;
  }, [dynamicValues]);

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
      nextState: BrowseFilterState,
      nextDynamicValues: Record<string, string>,
      closeSheet = false,
    ) => {
      const { query } = buildBrowseQueryFromState(spString, nextState, nextDynamicValues);
      if (!shouldSkipBrowseNavigation(query, spString)) {
        router.replace(query ? `/browse?${query}` : "/browse", { scroll: false });
      }
      if (closeSheet) setIsSheetOpen(false);
    },
    [router, spString],
  );

  const debouncedSearch = useDebouncedValue(state.q, TYPING_DEBOUNCE_MS);
  const currentSearchQuery = React.useMemo(
    () => new URLSearchParams(spString).get("q")?.trim() ?? "",
    [spString],
  );

  React.useEffect(() => {
    if (debouncedSearch.trim() === currentSearchQuery) {
      return;
    }

    applyState(
      { ...latestStateRef.current, q: debouncedSearch },
      latestDynamicValuesRef.current,
    );
  }, [applyState, currentSearchQuery, debouncedSearch]);

  const selectCategory = React.useCallback(
    (categoryId: string) => {
      const nextState: BrowseFilterState = {
        ...state,
        cat: categoryId,
        sub: "",
        make: "",
        model: "",
        yearFrom: "",
        yearTo: "",
      };
      setState(nextState);
      setDynamicValues({});
      applyState(nextState, {});
    },
    [applyState, state],
  );

  return (
    <section className="space-y-4">
      <BrowseSearch
        placeholder={searchPlaceholder}
        value={state.q}
        filterLabel={filterLabel}
        onChange={(value) => setState((prev) => ({ ...prev, q: value }))}
        onFilterClick={() => setIsSheetOpen(true)}
      />

      <BrowseCategoryTabs
        allLabel={allLabel}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        activeCategoryId={state.cat}
        onSelect={selectCategory}
      />

      <p className="text-sm text-muted-foreground">
        {totalCount} {resultsLabel}
      </p>

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
    </section>
  );
}
