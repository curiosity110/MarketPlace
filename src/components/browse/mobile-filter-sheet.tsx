"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CategoryFieldType } from "@prisma/client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  BrowseFilters,
  getBrowseDynamicValues,
  getBrowseFilterState,
  type BrowseFilterState,
} from "@/components/browse-filters";
import { Button } from "@/components/ui/button";

type CategoryOption = {
  id: string;
  slug: string;
  name: string;
  children: {
    id: string;
    slug: string;
    name: string;
  }[];
};

type CityOption = { id: string; name: string };

type CarMakeOption = {
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

type Template = {
  key: string;
  label: string;
  type: CategoryFieldType;
  options: string[];
};

type Props = {
  categories: CategoryOption[];
  cities: CityOption[];
  carMakes: CarMakeOption[];
  templatesByCategory?: Record<string, Template[]>;
  locale?: "en" | "mk";
  canUseFavoritesFilter?: boolean;
};

const EMPTY_FILTER_STATE = getBrowseFilterState(new URLSearchParams());

function normalizeNumeric(value: string) {
  return value.replace(/[^\d]/g, "");
}

function normalizePriceRange(minRaw: string, maxRaw: string) {
  const min = normalizeNumeric(minRaw).trim();
  const max = normalizeNumeric(maxRaw).trim();
  if (!min || !max) return { min, max };
  const minNum = Number(min);
  const maxNum = Number(max);
  if (!Number.isFinite(minNum) || !Number.isFinite(maxNum)) return { min, max };
  if (minNum <= maxNum) return { min, max };
  return { min: String(maxNum), max: String(minNum) };
}

export function MobileFilterSheet({
  categories,
  cities,
  carMakes,
  templatesByCategory = {},
  locale = "en",
  canUseFavoritesFilter = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spString = searchParams.toString();
  const sp = React.useMemo(() => new URLSearchParams(spString), [spString]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [draftState, setDraftState] = React.useState<BrowseFilterState>(() =>
    getBrowseFilterState(sp),
  );
  const [draftDynamicValues, setDraftDynamicValues] = React.useState<
    Record<string, string>
  >(() => getBrowseDynamicValues(sp));

  const isMk = locale === "mk";
  const text = isMk
    ? {
        searchPlaceholder: "??????, ?????, ?????? ????...",
        filters: "??????",
        clearAll: "??????? ??",
        apply: "???????",
        close: "???????",
      }
    : {
        searchPlaceholder: "Title, model, keyword...",
        filters: "Filters",
        clearAll: "Clear all",
        apply: "Apply",
        close: "Close",
      };

  React.useEffect(() => {
    if (!isOpen) return;
    const current = new URLSearchParams(spString);
    setDraftState(getBrowseFilterState(current));
    setDraftDynamicValues(getBrowseDynamicValues(current));
  }, [isOpen, spString]);

  React.useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const applyState = React.useCallback(
    (
      nextState: BrowseFilterState = draftState,
      nextDynamicValues: Record<string, string> = draftDynamicValues,
    ) => {
      const params = new URLSearchParams(spString);
      const cleanKeys = new Set([
        "q",
        "cat",
        "sub",
        "city",
        "condition",
        "cond",
        "make",
        "model",
        "yearFrom",
        "yearTo",
        "fav",
        "min",
        "max",
        "sort",
        "page",
      ]);

      [...params.keys()].forEach((key) => {
        if (cleanKeys.has(key) || key.startsWith("df_")) {
          params.delete(key);
        }
      });

      const normalizedPrice = normalizePriceRange(nextState.min, nextState.max);

      if (nextState.q.trim()) params.set("q", nextState.q.trim());
      if (nextState.cat) params.set("cat", nextState.cat);
      if (nextState.sub) params.set("sub", nextState.sub);
      if (nextState.city) params.set("city", nextState.city);
      if (nextState.condition) params.set("condition", nextState.condition);
      if (nextState.make) params.set("make", nextState.make);
      if (nextState.model) params.set("model", nextState.model);
      if (nextState.yearFrom) params.set("yearFrom", nextState.yearFrom);
      if (nextState.yearTo) params.set("yearTo", nextState.yearTo);
      if (nextState.fav === "1") params.set("fav", "1");
      if (normalizedPrice.min) params.set("min", normalizedPrice.min);
      if (normalizedPrice.max) params.set("max", normalizedPrice.max);
      if (nextState.sort !== "newest") params.set("sort", nextState.sort);

      Object.entries(nextDynamicValues).forEach(([key, value]) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        params.set(`df_${key}`, trimmed);
      });

      params.set("page", "1");
      const query = params.toString();
      router.replace(query ? `/browse?${query}` : "/browse", { scroll: false });
      setIsOpen(false);
    },
    [draftDynamicValues, draftState, router, spString],
  );

  const clearDraft = React.useCallback(() => {
    setDraftState(EMPTY_FILTER_STATE);
    setDraftDynamicValues({});
  }, []);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 flex-1 items-center gap-2 rounded-xl border border-border bg-input px-3 text-left text-sm text-foreground transition-colors hover:border-primary/25"
          onClick={() => setIsOpen(true)}
          aria-label={text.filters}
        >
          <Search size={15} className="text-muted-foreground" />
          <span className="truncate text-muted-foreground">
            {sp.get("q")?.trim() || text.searchPlaceholder}
          </span>
        </button>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl px-3"
          onClick={() => setIsOpen(true)}
        >
          <SlidersHorizontal size={15} className="mr-1.5" />
          {text.filters}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label={text.close}
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-background px-4 py-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {text.filters}
              </p>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
                aria-label={text.close}
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <BrowseFilters
                mode="mobile"
                categories={categories}
                cities={cities}
                templatesByCategory={templatesByCategory}
                carMakes={carMakes}
                locale={locale}
                canUseFavoritesFilter={canUseFavoritesFilter}
                showActiveChips={false}
                showResetButton={false}
                value={draftState}
                dynamicValues={draftDynamicValues}
                onChange={setDraftState}
                onDynamicValuesChange={setDraftDynamicValues}
                onApply={applyState}
              />
            </div>

            <div className="sticky bottom-0 z-10 grid grid-cols-2 gap-2 border-t border-border/70 bg-background p-4">
              <Button type="button" variant="outline" onClick={clearDraft}>
                {text.clearAll}
              </Button>
              <Button type="button" onClick={() => applyState()}>
                {text.apply}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
