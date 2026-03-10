"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/components/browse-filters.hooks";
import {
  TYPING_DEBOUNCE_MS,
  areBrowseStatesEqual,
  areStringRecordsEqual,
  buildBrowseQueryFromState,
  countBrowseActiveRefiners,
  getBrowseDynamicValues,
  getBrowseFilterState,
  parseBrowseSort,
  shouldSkipBrowseNavigation,
} from "@/components/browse-filters.utils";
import { Button } from "@/components/ui/button";
import { BrowseCategoryShortcuts } from "@/features/browse/browse-category-shortcuts";
import { BrowseFilterSheet } from "@/features/browse/browse-filter-sheet";
import { BrowseIntentChips } from "@/features/browse/browse-intent-chips";
import { BrowseIntentFilters } from "@/features/browse/browse-intent-filters";
import { BrowseSearch } from "@/features/browse/browse-search";
import {
  getIntentFilterSuggestion,
  resolveBrowseSearchIntent,
} from "@/features/browse/search-intent";
import { BrowseSort, type BrowseVisibleSort } from "@/features/browse/browse-sort";
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
  inferredCategoryId?: string;
  inferredSubcategoryId?: string;
  inferredCategoryConfidence?: "low" | "medium" | "high";
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
  inferredCategoryId,
  inferredSubcategoryId,
  inferredCategoryConfidence,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spString = searchParams.toString();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [state, setState] = React.useState<BrowseFilterState>(() =>
    getBrowseFilterState(new URLSearchParams(spString)),
  );
  const [dynamicValues, setDynamicValues] = React.useState<Record<string, string>>(() =>
    getBrowseDynamicValues(new URLSearchParams(spString)),
  );
  const latestStateRef = React.useRef(state);
  const latestDynamicValuesRef = React.useRef(dynamicValues);
  const blurTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    latestDynamicValuesRef.current = dynamicValues;
  }, [dynamicValues]);

  React.useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const latest = new URLSearchParams(spString);
    const nextState = getBrowseFilterState(latest);
    const nextDynamicValues = getBrowseDynamicValues(latest);

    setState((prev) => (areBrowseStatesEqual(prev, nextState) ? prev : nextState));
    setDynamicValues((prev) =>
      areStringRecordsEqual(prev, nextDynamicValues) ? prev : nextDynamicValues,
    );
  }, [spString]);

  const currentParams = React.useMemo(() => new URLSearchParams(spString), [spString]);
  const currentSearchQuery = currentParams.get("q")?.trim() ?? "";
  const currentSortParam = currentParams.get("sort");
  const allShortcutLabel = allLabel.includes(" ") ? (locale === "mk" ? "Сите" : "All") : allLabel;
  const localizedCategoryById = React.useMemo(
    () =>
      new Map(
        categories.flatMap((category) => [
          [category.id, category.name] as const,
          ...category.children.map((child) => [child.id, child.name] as const),
        ]),
      ),
    [categories],
  );
  const makeNameBySlug = React.useMemo(
    () => new Map(carMakes.map((make) => [make.slug, make.name] as const)),
    [carMakes],
  );
  const modelNameBySlug = React.useMemo(
    () =>
      new Map(
        carMakes.flatMap((make) =>
          make.models.map((model) => [model.slug, model.name] as const),
        ),
      ),
    [carMakes],
  );
  const liveSearchIntent = React.useMemo(
    () =>
      resolveBrowseSearchIntent({
        query: state.q,
        categories,
        carMakes,
      }),
    [carMakes, categories, state.q],
  );

  const intentFilterSuggestion = React.useMemo(
    () =>
      getIntentFilterSuggestion(liveSearchIntent, categories, carMakes, cities),
    [liveSearchIntent, categories, carMakes, cities],
  );
  const visibleSort = React.useMemo<BrowseVisibleSort>(() => {
    const parsed = parseBrowseSort(currentSortParam);
    if (currentSearchQuery && !currentSortParam) {
      return "relevance";
    }
    return parsed;
  }, [currentSearchQuery, currentSortParam]);

  const shouldOmitNewestSortParam = React.useCallback(
    (nextState: BrowseFilterState) =>
      nextState.sort === "newest" && Boolean(nextState.q.trim()) && !currentSortParam,
    [currentSortParam],
  );

  const applyState = React.useCallback(
    (
      nextState: BrowseFilterState,
      nextDynamicValues: Record<string, string>,
      options?: {
        closeSheet?: boolean;
        omitSortParamWhenNewest?: boolean;
      },
    ) => {
      const { query } = buildBrowseQueryFromState(spString, nextState, nextDynamicValues, {
        omitSortParamWhenNewest: options?.omitSortParamWhenNewest ?? true,
      });
      if (!shouldSkipBrowseNavigation(query, spString)) {
        router.replace(query ? `/browse?${query}` : "/browse", { scroll: false });
      }
      if (options?.closeSheet) {
        setIsSheetOpen(false);
      }
    },
    [router, spString],
  );

  const debouncedSearch = useDebouncedValue(state.q, TYPING_DEBOUNCE_MS);
  React.useEffect(() => {
    if (debouncedSearch.trim() === currentSearchQuery) {
      return;
    }

    applyState(
      { ...latestStateRef.current, q: debouncedSearch },
      latestDynamicValuesRef.current,
      {
        omitSortParamWhenNewest: shouldOmitNewestSortParam({
          ...latestStateRef.current,
          q: debouncedSearch,
        }),
      },
    );
  }, [applyState, currentSearchQuery, debouncedSearch, shouldOmitNewestSortParam]);

  const activeRefinerCount = React.useMemo(
    () => countBrowseActiveRefiners(state, dynamicValues),
    [dynamicValues, state],
  );

  const shortcutCategories = React.useMemo(() => {
    const maxShortcuts = currentSearchQuery ? 5 : 8;
    return categories
      .slice(0, maxShortcuts)
      .map((category) => ({ id: category.id, name: category.name }));
  }, [categories, currentSearchQuery]);

  const applyAssistState = React.useCallback(
    (nextState: BrowseFilterState) => {
      setState(nextState);
      applyState(nextState, dynamicValues, {
        omitSortParamWhenNewest: shouldOmitNewestSortParam(nextState),
      });
    },
    [applyState, dynamicValues, shouldOmitNewestSortParam],
  );

  const handleShortcutSelect = React.useCallback(
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
      setDynamicValues({});
      applyState(nextState, {}, {
        omitSortParamWhenNewest: shouldOmitNewestSortParam(nextState),
      });
      setState(nextState);
    },
    [applyState, shouldOmitNewestSortParam, state],
  );

  const handleSortChange = React.useCallback(
    (nextSort: BrowseVisibleSort) => {
      const nextState: BrowseFilterState = {
        ...state,
        sort: nextSort === "relevance" ? "newest" : nextSort,
      };
      setState(nextState);
      applyState(nextState, dynamicValues, {
        omitSortParamWhenNewest: nextSort === "relevance",
      });
    },
    [applyState, dynamicValues, state],
  );

  const clearSearchLabel = locale === "mk" ? "Исчисти пребарување" : "Clear search";

  const hasIntentFilters =
    intentFilterSuggestion.showCategory ||
    intentFilterSuggestion.showMake ||
    intentFilterSuggestion.showModel ||
    intentFilterSuggestion.showYearRange ||
    intentFilterSuggestion.showPriceRange ||
    intentFilterSuggestion.showCondition ||
    intentFilterSuggestion.showCity ||
    intentFilterSuggestion.showFuel;

  const handleIntentFilterChange = React.useCallback(
    (nextState: BrowseFilterState, nextDynamic?: Record<string, string>) => {
      setState(nextState);
      if (nextDynamic !== undefined) {
        setDynamicValues(nextDynamic);
      }
      applyState(nextState, nextDynamic ?? dynamicValues, {
        omitSortParamWhenNewest: shouldOmitNewestSortParam(nextState),
      });
    },
    [applyState, dynamicValues, shouldOmitNewestSortParam],
  );

  return (
    <section className="space-y-2.5 sm:space-y-3">
      <BrowseSearch
        placeholder={searchPlaceholder}
        value={state.q}
        clearLabel={clearSearchLabel}
        onChange={(value) => setState((prev) => ({ ...prev, q: value }))}
        onClear={() => {
          const nextState = { ...state, q: "" };
          setState(nextState);
          applyState(nextState, dynamicValues, {
            omitSortParamWhenNewest: shouldOmitNewestSortParam(nextState),
          });
        }}
        onFocus={() => {
          if (blurTimeoutRef.current) {
            window.clearTimeout(blurTimeoutRef.current);
          }
          setIsSearchActive(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = window.setTimeout(() => {
            setIsSearchActive(false);
          }, 120);
        }}
      />

      {state.q.trim() ? (
        <BrowseIntentChips
          locale={locale}
          query={state.q}
          intent={liveSearchIntent}
          state={state}
          dynamicValues={dynamicValues}
          categories={categories}
          cities={cities}
          onApply={handleIntentFilterChange}
        />
      ) : null}

      {state.q.trim() && hasIntentFilters ? (
        <BrowseIntentFilters
          locale={locale}
          suggestion={intentFilterSuggestion}
          state={state}
          dynamicValues={dynamicValues}
          categories={categories}
          cities={cities}
          carMakes={carMakes}
          onChange={handleIntentFilterChange}
        />
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-10.5 gap-2 rounded-full border-border/35 bg-card/72 px-3 text-foreground/82 shadow-[0_10px_22px_-24px_rgba(15,23,42,0.24)]"
          onClick={() => setIsSheetOpen(true)}
          aria-label={filterLabel}
        >
          <SlidersHorizontal size={16} />
          <span>{filterLabel}</span>
          {activeRefinerCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-background">
              {activeRefinerCount}
            </span>
          ) : null}
        </Button>
      </div>

      <BrowseCategoryShortcuts
        locale={locale}
        allLabel={allShortcutLabel || allLabel}
        categories={shortcutCategories}
        activeCategoryId={state.cat}
        hasQuery={Boolean(currentSearchQuery)}
        onSelect={handleShortcutSelect}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <p className="text-[11px] font-medium tracking-[0.01em] text-muted-foreground/65 sm:text-xs">
          {currentSearchQuery
            ? (locale === "mk"
                ? `${totalCount} ${resultsLabel} за „${currentSearchQuery}"`
                : `${totalCount} ${resultsLabel} for "${currentSearchQuery}"`)
            : `${totalCount} ${resultsLabel}`}
        </p>
        <BrowseSort
          locale={locale}
          value={visibleSort}
          hasQuery={Boolean(currentSearchQuery)}
          onChange={handleSortChange}
        />
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
        inferredCategoryId={inferredCategoryId}
        inferredSubcategoryId={inferredSubcategoryId}
        inferredCategoryConfidence={inferredCategoryConfidence}
        onChange={setState}
        onDynamicValuesChange={setDynamicValues}
        onApply={() =>
          applyState(state, dynamicValues, {
            closeSheet: true,
            omitSortParamWhenNewest: shouldOmitNewestSortParam(state),
          })
        }
      />
    </section>
  );
}
