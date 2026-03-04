"use client";

import type { ChangeEvent } from "react";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryFieldType, ListingCondition } from "@prisma/client";
import { CircleDollarSign, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Template = {
  key: string;
  label: string;
  type: CategoryFieldType;
  options: string[];
};

type ParentCategory = {
  id: string;
  name: string;
  children: { id: string; name: string }[];
};

type City = { id: string; name: string };

type BrowseSort = "newest" | "price-asc" | "price-desc";

type FilterState = {
  q: string;
  cat: string;
  sub: string;
  city: string;
  condition: string;
  fav: string;
  min: string;
  max: string;
  sort: BrowseSort;
};

type Props = {
  categories: ParentCategory[];
  cities: City[];
  templatesByCategory: Record<string, Template[]>;
  locale?: "en" | "mk";
  canUseFavoritesFilter?: boolean;
};

const TYPING_DEBOUNCE_MS = 320;

function parseSort(value: string | null): BrowseSort {
  if (value === "price-asc" || value === "price-desc") return value;
  return "newest";
}

function getInitialDynamicValues(sp: URLSearchParams) {
  const values: Record<string, string> = {};
  for (const [key, value] of sp.entries()) {
    if (!key.startsWith("df_")) continue;
    values[key.slice(3)] = value;
  }
  return values;
}

function normalizeNumericInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function toPositiveInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed);
}

function normalizeMinMax(minValue: string, maxValue: string) {
  const minInt = toPositiveInteger(minValue);
  const maxInt = toPositiveInteger(maxValue);

  if (minInt !== undefined && maxInt !== undefined && minInt > maxInt) {
    return {
      min: String(maxInt),
      max: String(minInt),
      hasSwap: true,
    };
  }

  return {
    min: minInt === undefined ? "" : String(minInt),
    max: maxInt === undefined ? "" : String(maxInt),
    hasSwap: false,
  };
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}

function areStatesEqual(a: FilterState, b: FilterState) {
  return (
    a.q === b.q &&
    a.cat === b.cat &&
    a.sub === b.sub &&
    a.city === b.city &&
    a.condition === b.condition &&
    a.fav === b.fav &&
    a.min === b.min &&
    a.max === b.max &&
    a.sort === b.sort
  );
}

function areRecordsEqual(
  a: Record<string, string>,
  b: Record<string, string>,
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function canonicalizeQueryString(input: string) {
  const entries = [...new URLSearchParams(input).entries()].sort((left, right) => {
    if (left[0] === right[0]) return left[1].localeCompare(right[1]);
    return left[0].localeCompare(right[0]);
  });
  return new URLSearchParams(entries).toString();
}

export function BrowseFilters({
  categories,
  cities,
  templatesByCategory,
  locale = "en",
  canUseFavoritesFilter = false,
}: Props) {
  const router = useRouter();
  const spReadonly = useSearchParams();
  const spString = spReadonly.toString();
  const sp = React.useMemo(() => new URLSearchParams(spString), [spString]);

  const isMk = locale === "mk";
  const text = isMk
    ? {
        search: "Пребарување",
        searchPlaceholder: "Наслов, модел, клучен збор...",
        category: "Категорија",
        allCategories: "Сите категории",
        subcategory: "Поткатегорија",
        allSubcategories: "Сите поткатегории",
        selectCategoryFirst: "Прво избери категорија",
        city: "Град",
        allCities: "Сите градови",
        condition: "Состојба",
        anyCondition: "Секоја состојба",
        priceRange: "Опсег на цена",
        minPrice: "Мин цена",
        maxPrice: "Макс цена",
        mkd: "МКД",
        categoryFilters: "Филтри за категорија",
        extraFilters: "Дополнителни филтри",
        any: "Секој",
        apply: "Примени филтри",
        clear: "Исчисти сè",
        orderBy: "Подреди по",
        newest: "Најнови прво",
        priceAsc: "Цена од ниска кон висока",
        priceDesc: "Цена од висока кон ниска",
        resetFilters: "Исчисти филтри",
        activeFilters: "Активни филтри",
        clearAll: "Исчисти сè",
        searchChip: "Пребарување",
        categoryChip: "Категорија",
        subcategoryChip: "Поткатегорија",
        cityChip: "Град",
        conditionChip: "Состојба",
        priceChip: "Цена",
        favoritesChip: "Омилени",
        minLabel: "мин",
        maxLabel: "макс",
        removeFilter: "Отстрани филтер",
        priceAutoFixed: "Мин/макс се усогласени автоматски.",
        favoritesOnly: "Само омилени",
      }
    : {
        search: "Search",
        searchPlaceholder: "Title, model, keyword...",
        category: "Category",
        allCategories: "All categories",
        subcategory: "Subcategory",
        allSubcategories: "All subcategories",
        selectCategoryFirst: "Select category first",
        city: "City",
        allCities: "All cities",
        condition: "Condition",
        anyCondition: "Any condition",
        priceRange: "Price range",
        minPrice: "Min price",
        maxPrice: "Max price",
        mkd: "MKD",
        categoryFilters: "Category specific filters",
        extraFilters: "Extra filters",
        any: "Any",
        apply: "Apply filters",
        clear: "Clear all",
        orderBy: "Sort by",
        newest: "Newest first",
        priceAsc: "Price low to high",
        priceDesc: "Price high to low",
        resetFilters: "Reset filters",
        activeFilters: "Active filters",
        clearAll: "Clear all",
        searchChip: "Search",
        categoryChip: "Category",
        subcategoryChip: "Subcategory",
        cityChip: "City",
        conditionChip: "Condition",
        priceChip: "Price",
        favoritesChip: "Favorites",
        minLabel: "min",
        maxLabel: "max",
        removeFilter: "Remove filter",
        priceAutoFixed: "Min/max were aligned automatically.",
        favoritesOnly: "Favorites only",
      };

  const conditionLabelByValue = React.useMemo<Record<ListingCondition, string>>(
    () =>
      isMk
        ? { NEW: "Ново", USED: "Користено", REFURBISHED: "Рефурбиширано" }
        : { NEW: "New", USED: "Used", REFURBISHED: "Refurbished" },
    [isMk],
  );

  const sortOptions = React.useMemo<{ value: BrowseSort; label: string }[]>(
    () => [
      { value: "newest", label: text.newest },
      { value: "price-asc", label: text.priceAsc },
      { value: "price-desc", label: text.priceDesc },
    ],
    [text.newest, text.priceAsc, text.priceDesc],
  );

  const [state, setState] = React.useState<FilterState>({
    q: sp.get("q") ?? "",
    cat: sp.get("cat") ?? "",
    sub: sp.get("sub") ?? "",
    city: sp.get("city") ?? "",
    condition: sp.get("condition") ?? sp.get("cond") ?? "",
    fav: sp.get("fav") === "1" ? "1" : "",
    min: sp.get("min") ?? "",
    max: sp.get("max") ?? "",
    sort: parseSort(sp.get("sort")),
  });

  const [dynamicValues, setDynamicValues] = React.useState<Record<string, string>>(
    getInitialDynamicValues(sp),
  );

  const [lastDispatchedQuery, setLastDispatchedQuery] = React.useState<string>(() =>
    canonicalizeQueryString(spString),
  );

  React.useEffect(() => {
    const canonical = canonicalizeQueryString(spString);
    setLastDispatchedQuery((prev) => (prev === canonical ? prev : canonical));
  }, [spString]);

  React.useEffect(() => {
    const latest = new URLSearchParams(spString);
    const nextState: FilterState = {
      q: latest.get("q") ?? "",
      cat: latest.get("cat") ?? "",
      sub: latest.get("sub") ?? "",
      city: latest.get("city") ?? "",
      condition: latest.get("condition") ?? latest.get("cond") ?? "",
      fav: latest.get("fav") === "1" ? "1" : "",
      min: latest.get("min") ?? "",
      max: latest.get("max") ?? "",
      sort: parseSort(latest.get("sort")),
    };
    const nextDynamicValues = getInitialDynamicValues(latest);

    setState((prev) => (areStatesEqual(prev, nextState) ? prev : nextState));
    setDynamicValues((prev) =>
      areRecordsEqual(prev, nextDynamicValues) ? prev : nextDynamicValues,
    );
  }, [spString]);

  const parent = categories.find((category) => category.id === state.cat);
  const subcategories = parent?.children ?? [];
  const selectedCategoryId = state.sub || state.cat;
  const dynamicTemplates = React.useMemo(
    () => templatesByCategory[selectedCategoryId] ?? [],
    [selectedCategoryId, templatesByCategory],
  );

  const allTemplateLabels = React.useMemo(() => {
    const map = new Map<string, string>();
    Object.values(templatesByCategory).forEach((templates) => {
      templates.forEach((template) => map.set(template.key, template.label));
    });
    return map;
  }, [templatesByCategory]);

  const parentLabelById = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const subLabelById = React.useMemo(
    () =>
      new Map(
        categories.flatMap((category) =>
          category.children.map((child) => [child.id, child.name] as const),
        ),
      ),
    [categories],
  );

  const cityLabelById = React.useMemo(
    () => new Map(cities.map((cityItem) => [cityItem.id, cityItem.name])),
    [cities],
  );

  const hasAnyFilter = React.useMemo(() => {
    const dynamicHasValue = Object.values(dynamicValues).some((value) => value.trim().length > 0);
    return (
      Boolean(state.q.trim()) ||
      Boolean(state.cat) ||
      Boolean(state.sub) ||
      Boolean(state.city) ||
      Boolean(state.condition) ||
      state.fav === "1" ||
      Boolean(state.min.trim()) ||
      Boolean(state.max.trim()) ||
      state.sort !== "newest" ||
      dynamicHasValue
    );
  }, [dynamicValues, state]);

  const applyFilters = React.useCallback(
    (nextState: FilterState, nextDynamicValues: Record<string, string>) => {
      const normalizedRange = normalizeMinMax(nextState.min, nextState.max);

      const params = new URLSearchParams(spString);
      const cleanKeys = new Set([
        "q",
        "cat",
        "sub",
        "city",
        "condition",
        "cond",
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

      if (nextState.q.trim()) params.set("q", nextState.q.trim());
      if (nextState.cat) params.set("cat", nextState.cat);
      if (nextState.sub) params.set("sub", nextState.sub);
      if (nextState.city) params.set("city", nextState.city);
      if (nextState.condition) params.set("condition", nextState.condition);
      if (nextState.fav === "1") params.set("fav", "1");
      if (normalizedRange.min) params.set("min", normalizedRange.min);
      if (normalizedRange.max) params.set("max", normalizedRange.max);
      if (nextState.sort !== "newest") params.set("sort", nextState.sort);

      Object.entries(nextDynamicValues).forEach(([key, value]) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        params.set(`df_${key}`, trimmed);
      });

      const hasFilters =
        Boolean(nextState.q.trim()) ||
        Boolean(nextState.cat) ||
        Boolean(nextState.sub) ||
        Boolean(nextState.city) ||
        Boolean(nextState.condition) ||
        nextState.fav === "1" ||
        Boolean(normalizedRange.min) ||
        Boolean(normalizedRange.max) ||
        nextState.sort !== "newest" ||
        Object.values(nextDynamicValues).some((value) => value.trim().length > 0);

      if (hasFilters) {
        params.set("page", "1");
      }

      const query = params.toString();
      const nextCanonical = canonicalizeQueryString(query);
      const currentCanonical = canonicalizeQueryString(spString);

      if (
        nextCanonical === currentCanonical ||
        nextCanonical === lastDispatchedQuery
      ) {
        return;
      }

      setLastDispatchedQuery(nextCanonical);
      router.replace(query ? `/browse?${query}` : "/browse", { scroll: false });
    },
    [lastDispatchedQuery, router, spString],
  );

  const debouncedQ = useDebouncedValue(state.q, TYPING_DEBOUNCE_MS);
  const debouncedMin = useDebouncedValue(state.min, TYPING_DEBOUNCE_MS);
  const debouncedMax = useDebouncedValue(state.max, TYPING_DEBOUNCE_MS);
  const debouncedDynamicValues = useDebouncedValue(dynamicValues, TYPING_DEBOUNCE_MS);

  const didMountRef = React.useRef(false);
  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    applyFilters(
      {
        ...state,
        q: debouncedQ,
        min: debouncedMin,
        max: debouncedMax,
      },
      dynamicValues,
    );
  }, [applyFilters, debouncedMax, debouncedMin, debouncedQ, dynamicValues, state]);

  const dynamicDidMountRef = React.useRef(false);
  React.useEffect(() => {
    if (!dynamicDidMountRef.current) {
      dynamicDidMountRef.current = true;
      return;
    }
    applyFilters(state, debouncedDynamicValues);
  }, [applyFilters, debouncedDynamicValues, state]);

  React.useEffect(() => {
    setDynamicValues((prev) => {
      const allowedKeys = new Set(dynamicTemplates.map((template) => template.key));
      const next = Object.fromEntries(
        Object.entries(prev).filter(([key]) => allowedKeys.has(key)),
      );
      return areRecordsEqual(prev, next) ? prev : next;
    });
  }, [dynamicTemplates]);

  const hasPriceSwap = React.useMemo(() => {
    const minValue = toPositiveInteger(state.min);
    const maxValue = toPositiveInteger(state.max);
    return minValue !== undefined && maxValue !== undefined && minValue > maxValue;
  }, [state.max, state.min]);

  const resetAll = React.useCallback(() => {
    const clearedState: FilterState = {
      q: "",
      cat: "",
      sub: "",
      city: "",
      condition: "",
      fav: "",
      min: "",
      max: "",
      sort: "newest",
    };
    setState(clearedState);
    setDynamicValues({});
    applyFilters(clearedState, {});
  }, [applyFilters]);

  const activeFilterChips = React.useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (state.q.trim()) {
      chips.push({
        key: "q",
        label: `${text.searchChip}: ${state.q.trim()}`,
        onRemove: () => {
          const nextState = { ...state, q: "" };
          setState(nextState);
          applyFilters(nextState, dynamicValues);
        },
      });
    }

    if (state.cat) {
      const label = parentLabelById.get(state.cat) || state.cat;
      chips.push({
        key: "cat",
        label: `${text.categoryChip}: ${label}`,
        onRemove: () => {
          const nextState = { ...state, cat: "", sub: "" };
          setState(nextState);
          setDynamicValues({});
          applyFilters(nextState, {});
        },
      });
    }

    if (state.sub) {
      const label = subLabelById.get(state.sub) || state.sub;
      chips.push({
        key: "sub",
        label: `${text.subcategoryChip}: ${label}`,
        onRemove: () => {
          const nextState = { ...state, sub: "" };
          setState(nextState);
          applyFilters(nextState, dynamicValues);
        },
      });
    }

    if (state.city) {
      const label = cityLabelById.get(state.city) || state.city;
      chips.push({
        key: "city",
        label: `${text.cityChip}: ${label}`,
        onRemove: () => {
          const nextState = { ...state, city: "" };
          setState(nextState);
          applyFilters(nextState, dynamicValues);
        },
      });
    }

    if (state.condition) {
      const label = conditionLabelByValue[state.condition as ListingCondition] || state.condition;
      chips.push({
        key: "condition",
        label: `${text.conditionChip}: ${label}`,
        onRemove: () => {
          const nextState = { ...state, condition: "" };
          setState(nextState);
          applyFilters(nextState, dynamicValues);
        },
      });
    }

    if (state.fav === "1") {
      chips.push({
        key: "fav",
        label: text.favoritesChip,
        onRemove: () => {
          const nextState = { ...state, fav: "" };
          setState(nextState);
          applyFilters(nextState, dynamicValues);
        },
      });
    }

    if (state.min.trim() || state.max.trim()) {
      const normalizedRange = normalizeMinMax(state.min, state.max);
      const minLabel = normalizedRange.min ? normalizedRange.min : text.minLabel;
      const maxLabel = normalizedRange.max ? normalizedRange.max : text.maxLabel;

      chips.push({
        key: "price",
        label: `${text.priceChip}: ${minLabel} - ${maxLabel} ${text.mkd}`,
        onRemove: () => {
          const nextState = { ...state, min: "", max: "" };
          setState(nextState);
          applyFilters(nextState, dynamicValues);
        },
      });
    }

    if (state.sort !== "newest") {
      const sortLabel =
        sortOptions.find((option) => option.value === state.sort)?.label || state.sort;
      chips.push({
        key: "sort",
        label: `${text.orderBy}: ${sortLabel}`,
        onRemove: () => {
          const nextState = { ...state, sort: "newest" as BrowseSort };
          setState(nextState);
          applyFilters(nextState, dynamicValues);
        },
      });
    }

    Object.entries(dynamicValues).forEach(([key, value]) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const label = allTemplateLabels.get(key) || key;
      chips.push({
        key: `df_${key}`,
        label: `${label}: ${trimmed}`,
        onRemove: () => {
          const nextDynamic = { ...dynamicValues, [key]: "" };
          setDynamicValues(nextDynamic);
          applyFilters(state, nextDynamic);
        },
      });
    });

    return chips;
  }, [
    allTemplateLabels,
    applyFilters,
    cityLabelById,
    conditionLabelByValue,
    dynamicValues,
    parentLabelById,
    state,
    subLabelById,
    text.categoryChip,
    text.cityChip,
    text.conditionChip,
    text.favoritesChip,
    text.maxLabel,
    text.minLabel,
    text.mkd,
    text.priceChip,
    text.searchChip,
    text.subcategoryChip,
    text.orderBy,
    sortOptions,
  ]);

  const onCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCat = event.target.value;
    const allowedKeys = new Set(
      (templatesByCategory[nextCat] ?? []).map((template) => template.key),
    );
    const nextDynamicValues = Object.fromEntries(
      Object.entries(dynamicValues).filter(([key]) => allowedKeys.has(key)),
    );

    const nextState: FilterState = {
      ...state,
      cat: nextCat,
      sub: "",
    };

    setState(nextState);
    setDynamicValues(nextDynamicValues);
    applyFilters(nextState, nextDynamicValues);
  };

  const onSubcategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextState: FilterState = {
      ...state,
      sub: event.target.value,
    };
    setState(nextState);
    applyFilters(nextState, dynamicValues);
  };

  const onImmediateSelectChange =
    (key: keyof Pick<FilterState, "city" | "condition" | "sort">) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextState: FilterState = {
        ...state,
        [key]: event.target.value as FilterState[typeof key],
      };
      setState(nextState);
      applyFilters(nextState, dynamicValues);
    };

  function renderDynamicInput(template: Template) {
    const value = dynamicValues[template.key] ?? "";
    const commonClasses = "h-10";

    if (template.type === CategoryFieldType.SELECT) {
      return (
        <Select
          name={`df_${template.key}`}
          value={value}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const next = { ...dynamicValues, [template.key]: event.target.value };
            setDynamicValues(next);
            applyFilters(state, next);
          }}
          className={commonClasses}
        >
          <option value="">
            {text.any} {template.label.toLowerCase()}
          </option>
          {template.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      );
    }

    return (
      <Input
        name={`df_${template.key}`}
        value={value}
        onChange={(event) =>
          setDynamicValues((prev) => ({ ...prev, [template.key]: event.target.value }))
        }
        className={commonClasses}
        type={template.type === CategoryFieldType.NUMBER ? "number" : "text"}
        placeholder={`${text.any} ${template.label.toLowerCase()}`}
        autoComplete="off"
      />
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters(state, dynamicValues);
      }}
    >
      <button type="submit" className="sr-only">
        {text.apply}
      </button>

      {(hasAnyFilter || activeFilterChips.length > 0) && (
        <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {text.activeFilters}
            </p>
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={resetAll}
            >
              {text.clearAll}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary"
                onClick={chip.onRemove}
                aria-label={`${text.removeFilter}: ${chip.label}`}
              >
                <span>{chip.label}</span>
                <X size={13} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-12">
        <label className="space-y-1 lg:col-span-8">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.search}
          </span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={15}
            />
            <Input
              name="q"
              value={state.q}
              onChange={(event) =>
                setState((prev) => ({ ...prev, q: event.target.value }))
              }
              placeholder={text.searchPlaceholder}
              className="pl-9"
              autoComplete="off"
            />
          </div>
        </label>

        <div className="space-y-1 lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.orderBy}
          </p>
          <div className="inline-flex w-full rounded-xl border border-border/80 bg-muted/20 p-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "h-8 flex-1 rounded-lg px-2 text-xs font-semibold transition-colors",
                  state.sort === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => {
                  const nextState: FilterState = { ...state, sort: option.value };
                  setState(nextState);
                  applyFilters(nextState, dynamicValues);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          {canUseFavoritesFilter && (
            <button
              type="button"
              className={cn(
                "mt-2 inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors",
                state.fav === "1"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
              )}
              onClick={() => {
                const nextState: FilterState = {
                  ...state,
                  fav: state.fav === "1" ? "" : "1",
                };
                setState(nextState);
                applyFilters(nextState, dynamicValues);
              }}
            >
              {text.favoritesOnly}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.category}
          </span>
          <Select name="cat" value={state.cat} onChange={onCategoryChange}>
            <option value="">{text.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.subcategory}
          </span>
          <Select
            name="sub"
            value={state.sub}
            disabled={!state.cat}
            onChange={onSubcategoryChange}
          >
            <option value="">
              {state.cat ? text.allSubcategories : text.selectCategoryFirst}
            </option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.city}
          </span>
          <Select
            name="city"
            value={state.city}
            onChange={onImmediateSelectChange("city")}
          >
            <option value="">{text.allCities}</option>
            {cities.map((cityItem) => (
              <option key={cityItem.id} value={cityItem.id}>
                {cityItem.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.condition}
          </span>
          <Select
            name="condition"
            value={state.condition}
            onChange={onImmediateSelectChange("condition")}
          >
            <option value="">{text.anyCondition}</option>
            {Object.values(ListingCondition).map((item) => (
              <option key={item} value={item}>
                {conditionLabelByValue[item]}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="rounded-2xl border border-dashed border-primary/25 bg-orange-50/40 p-3 dark:bg-orange-500/5">
        <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CircleDollarSign size={14} />
          {text.priceRange}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="relative">
            <Input
              name="min"
              type="text"
              inputMode="numeric"
              value={state.min}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  min: normalizeNumericInput(event.target.value),
                }))
              }
              placeholder={text.minPrice}
              autoComplete="off"
              className="pr-12"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
              {text.mkd}
            </span>
          </div>
          <div className="relative">
            <Input
              name="max"
              type="text"
              inputMode="numeric"
              value={state.max}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  max: normalizeNumericInput(event.target.value),
                }))
              }
              placeholder={text.maxPrice}
              autoComplete="off"
              className="pr-12"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
              {text.mkd}
            </span>
          </div>
        </div>
        {hasPriceSwap && (
          <p className="mt-2 text-xs text-warning">{text.priceAutoFixed}</p>
        )}
      </div>

      {dynamicTemplates.length > 0 && (
        <div className="rounded-2xl border border-secondary/20 bg-blue-50/40 p-3 dark:bg-blue-500/5">
          <p className="mb-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Filter size={14} />
            {state.cat || state.sub ? text.categoryFilters : text.extraFilters}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dynamicTemplates.map((template) => (
              <label key={template.key} className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  {template.label}
                </span>
                {renderDynamicInput(template)}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={resetAll}>
          {text.resetFilters}
        </Button>
      </div>
    </form>
  );
}
