"use client";

import type { ChangeEvent } from "react";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryFieldType, ListingCondition } from "@prisma/client";
import { X } from "lucide-react";
import { BrowseDesktopFiltersRow } from "@/components/browse/desktop-filters-row";
import { BrowseFiltersActiveChips } from "@/components/browse/filters-active-chips";
import type {
  BrowseFilterState,
  BrowseFiltersProps,
  BrowseSort,
  BrowseTemplate as Template,
} from "@/components/browse/filters.types";
import { useDebouncedValue } from "@/components/browse/filters.hooks";
import {
  TYPING_DEBOUNCE_MS,
  areBrowseStatesEqual,
  areStringRecordsEqual,
  buildBrowseQueryFromState,
  getBrowseDynamicValues,
  getBrowseFilterState,
  hasAnyBrowseFilter,
  isCarCoreTemplate,
  isCarExtraTemplate,
  isCarIdentityTemplate,
  isCarsSlug,
  normalizeMinMax,
  normalizeNumericInput,
  parseBrowseSort,
  shouldSkipBrowseNavigation,
  toPositiveInteger,
} from "@/components/browse/filters.utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { uiModal, uiTypography } from "@/components/ui/ui-patterns";
import { cn } from "@/lib/utils";

export {
  getBrowseDynamicValues,
  getBrowseFilterState,
} from "@/components/browse/filters.utils";
export type { BrowseFilterState, BrowseSort } from "@/components/browse/filters.types";

export function BrowseFilters({
  categories,
  cities,
  templatesByCategory,
  carMakes,
  locale = "en",
  canUseFavoritesFilter = false,
  showActiveChips = true,
  mode = "desktop",
  value,
  dynamicValues: controlledDynamicValues,
  onChange,
  onDynamicValuesChange,
  onApply,
  showResetButton = true,
}: BrowseFiltersProps) {
  const isMobileMode = mode === "mobile";
  const router = useRouter();
  const spReadonly = useSearchParams();
  const spString = spReadonly.toString();
  const sp = React.useMemo(() => new URLSearchParams(spString), [spString]);
  const fallbackState = React.useMemo(() => getBrowseFilterState(sp), [sp]);

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
        makeChip: "Марка",
        modelChip: "Модел",
        yearChip: "Година",
        make: "Марка",
        model: "Модел",
        allMakes: "Сите марки",
        allModels: "Сите модели",
        yearFrom: "Година од",
        yearTo: "Година до",
        carsFilters: "Филтри за коли",
        selectMakeFirst: "Прво избери марка",
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
        makeChip: "Make",
        modelChip: "Model",
        yearChip: "Year",
        make: "Make",
        model: "Model",
        allMakes: "All makes",
        allModels: "All models",
        yearFrom: "Year from",
        yearTo: "Year to",
        carsFilters: "Cars filters",
        selectMakeFirst: "Select make first",
        favoritesChip: "Favorites",
        minLabel: "min",
        maxLabel: "max",
        removeFilter: "Remove filter",
        priceAutoFixed: "Min/max were aligned automatically.",
        favoritesOnly: "Favorites only",
      };
  const filtersLabel = isMk ? "Филтри" : "Filters";
  const clearAllLabel = isMk ? "Исчисти сè" : "Clear all";
  const resetLabel = isMk ? "Ресетирај" : "Reset";
  const moreFiltersLabel = isMk ? "Повеќе филтри" : "More filters";
  const priceLabel = isMk ? "Цена" : "Price";
  const vehicleDetailsLabel = isMk ? "Детали за возило" : "Vehicle details";
  const basicsLabel = isMk ? "Основни филтри" : "Basic filters";

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

  const [desktopState, setDesktopState] = React.useState<BrowseFilterState>(
    fallbackState,
  );
  const [desktopDynamicValues, setDesktopDynamicValues] = React.useState<
    Record<string, string>
  >(
    getBrowseDynamicValues(sp),
  );
  const state = React.useMemo(
    () => (isMobileMode ? value ?? fallbackState : desktopState),
    [desktopState, fallbackState, isMobileMode, value],
  );
  const dynamicValues = React.useMemo(
    () =>
      isMobileMode
        ? controlledDynamicValues ?? {}
        : desktopDynamicValues,
    [controlledDynamicValues, desktopDynamicValues, isMobileMode],
  );
  const setState = React.useCallback<
    React.Dispatch<React.SetStateAction<BrowseFilterState>>
  >(
    (next) => {
      if (isMobileMode) {
        onChange?.(next);
        return;
      }
      setDesktopState(next);
    },
    [isMobileMode, onChange],
  );
  const setDynamicValues = React.useCallback<
    React.Dispatch<React.SetStateAction<Record<string, string>>>
  >(
    (next) => {
      if (isMobileMode) {
        onDynamicValuesChange?.(next);
        return;
      }
      setDesktopDynamicValues(next);
    },
    [isMobileMode, onDynamicValuesChange],
  );

  React.useEffect(() => {
    if (isMobileMode) return;
    const latest = new URLSearchParams(spString);
    const nextState = getBrowseFilterState(latest);
    const nextDynamicValues = getBrowseDynamicValues(latest);

    setState((prev) => (areBrowseStatesEqual(prev, nextState) ? prev : nextState));
    setDynamicValues((prev) =>
      areStringRecordsEqual(prev, nextDynamicValues) ? prev : nextDynamicValues,
    );
  }, [isMobileMode, setDynamicValues, setState, spString]);

  const parent = categories.find((category) => category.id === state.cat);
  const subcategories = parent?.children ?? [];
  const selectedCategoryId = state.sub || state.cat;
  const selectedSubParent = state.sub
    ? categories.find((category) =>
        category.children.some((child) => child.id === state.sub),
      )
    : null;
  const carsRootSlug = state.sub ? selectedSubParent?.slug : parent?.slug;
  const isCarsCategorySelected = isCarsSlug(carsRootSlug);
  const makeBySlug = React.useMemo(
    () => new Map(carMakes.map((make) => [make.slug, make])),
    [carMakes],
  );
  const selectedMake = state.make ? makeBySlug.get(state.make) : undefined;
  const carModelOptions = React.useMemo(
    () => selectedMake?.models ?? [],
    [selectedMake],
  );
  const currentYear = new Date().getFullYear() + 1;
  const carYearOptions = React.useMemo(
    () =>
      Array.from({ length: currentYear - 1980 + 1 }, (_, index) =>
        String(currentYear - index),
      ),
    [currentYear],
  );
  const dynamicTemplates = React.useMemo(
    () => templatesByCategory[selectedCategoryId] ?? [],
    [selectedCategoryId, templatesByCategory],
  );
  const carExtraTemplates = isCarsCategorySelected
    ? dynamicTemplates.filter((template) => isCarExtraTemplate(template))
    : [];
  const visibleDynamicTemplates = isCarsCategorySelected
    ? dynamicTemplates.filter((template) => !isCarCoreTemplate(template))
    : dynamicTemplates;

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
  const makeLabelBySlug = React.useMemo(
    () => new Map(carMakes.map((make) => [make.slug, make.name] as const)),
    [carMakes],
  );
  const modelLabelBySlug = React.useMemo(
    () =>
      new Map(
        carMakes.flatMap((make) =>
          make.models.map((model) => [model.slug, model.name] as const),
        ),
      ),
    [carMakes],
  );

  const hasAnyFilter = React.useMemo(
    () => hasAnyBrowseFilter(state, dynamicValues),
    [dynamicValues, state],
  );

  const applyFilters = React.useCallback(
    (nextState: BrowseFilterState, nextDynamicValues: Record<string, string>) => {
      if (isMobileMode) {
        onApply?.(nextState, nextDynamicValues);
        return;
      }

      const { query } = buildBrowseQueryFromState(
        spString,
        nextState,
        nextDynamicValues,
      );
      if (shouldSkipBrowseNavigation(query, spString)) {
        return;
      }

      router.replace(query ? `/browse?${query}` : "/browse", { scroll: false });
    },
    [isMobileMode, onApply, router, spString],
  );

  const debouncedQ = useDebouncedValue(state.q, TYPING_DEBOUNCE_MS);
  const debouncedMin = useDebouncedValue(state.min, TYPING_DEBOUNCE_MS);
  const debouncedMax = useDebouncedValue(state.max, TYPING_DEBOUNCE_MS);
  const debouncedDynamicValues = useDebouncedValue(dynamicValues, TYPING_DEBOUNCE_MS);

  const didMountRef = React.useRef(false);
  React.useEffect(() => {
    if (isMobileMode) return;
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
  }, [
    applyFilters,
    debouncedMax,
    debouncedMin,
    debouncedQ,
    dynamicValues,
    isMobileMode,
    state,
  ]);

  const dynamicDidMountRef = React.useRef(false);
  React.useEffect(() => {
    if (isMobileMode) return;
    if (!dynamicDidMountRef.current) {
      dynamicDidMountRef.current = true;
      return;
    }
    applyFilters(state, debouncedDynamicValues);
  }, [applyFilters, debouncedDynamicValues, isMobileMode, state]);

  React.useEffect(() => {
    setDynamicValues((prev) => {
      const allowedTemplates = dynamicTemplates.filter(
        (template) =>
          !isCarsCategorySelected || !isCarIdentityTemplate(template),
      );
      const allowedKeys = new Set(
        allowedTemplates.map((template) => template.key),
      );
      const next = Object.fromEntries(
        Object.entries(prev).filter(([key]) => allowedKeys.has(key)),
      );
      return areStringRecordsEqual(prev, next) ? prev : next;
    });
  }, [dynamicTemplates, isCarsCategorySelected, setDynamicValues]);

  React.useEffect(() => {
    if (isMobileMode) return;
    if (isCarsCategorySelected) return;
    if (!state.make && !state.model && !state.yearFrom && !state.yearTo) return;
    const nextState: BrowseFilterState = {
      ...state,
      make: "",
      model: "",
      yearFrom: "",
      yearTo: "",
    };
    setState(nextState);
    applyFilters(nextState, dynamicValues);
  }, [
    applyFilters,
    dynamicValues,
    isMobileMode,
    isCarsCategorySelected,
    setState,
    state,
  ]);

  React.useEffect(() => {
    if (isMobileMode) return;
    if (!isCarsCategorySelected) return;
    if (!state.model) return;
    if (!state.make) {
      const nextState: BrowseFilterState = { ...state, model: "" };
      setState(nextState);
      applyFilters(nextState, dynamicValues);
      return;
    }
    const modelIsValidForMake = carModelOptions.some(
      (model) => model.slug === state.model,
    );
    if (!modelIsValidForMake) {
      const nextState: BrowseFilterState = { ...state, model: "" };
      setState(nextState);
      applyFilters(nextState, dynamicValues);
    }
  }, [
    applyFilters,
    carModelOptions,
    dynamicValues,
    isMobileMode,
    isCarsCategorySelected,
    setState,
    state,
  ]);

  const hasPriceSwap = React.useMemo(() => {
    const minValue = toPositiveInteger(state.min);
    const maxValue = toPositiveInteger(state.max);
    return minValue !== undefined && maxValue !== undefined && minValue > maxValue;
  }, [state.max, state.min]);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDrawerOpen]);

  const resetAll = React.useCallback(() => {
    const clearedState: BrowseFilterState = {
      q: "",
      cat: "",
      sub: "",
      city: "",
      condition: "",
      make: "",
      model: "",
      yearFrom: "",
      yearTo: "",
      fav: "",
      min: "",
      max: "",
      sort: "newest",
    };
    setState(clearedState);
    setDynamicValues({});
    setIsDrawerOpen(false);
    if (isMobileMode) return;
    applyFilters(clearedState, {});
  }, [applyFilters, isMobileMode, setDynamicValues, setState]);

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

    if (state.make) {
      const label = makeLabelBySlug.get(state.make) || state.make;
      chips.push({
        key: "make",
        label: `${text.makeChip}: ${label}`,
        onRemove: () => {
          const nextState = { ...state, make: "", model: "" };
          setState(nextState);
          applyFilters(nextState, dynamicValues);
        },
      });
    }

    if (state.model) {
      const label = modelLabelBySlug.get(state.model) || state.model;
      chips.push({
        key: "model",
        label: `${text.modelChip}: ${label}`,
        onRemove: () => {
          const nextState = { ...state, model: "" };
          setState(nextState);
          applyFilters(nextState, dynamicValues);
        },
      });
    }

    if (state.yearFrom.trim() || state.yearTo.trim()) {
      const yearLabel =
        state.yearFrom.trim() && state.yearTo.trim()
          ? `${state.yearFrom.trim()} - ${state.yearTo.trim()}`
          : state.yearFrom.trim()
            ? `${text.yearFrom}: ${state.yearFrom.trim()}`
            : `${text.yearTo}: ${state.yearTo.trim()}`;

      chips.push({
        key: "year",
        label: `${text.yearChip}: ${yearLabel}`,
        onRemove: () => {
          const nextState = { ...state, yearFrom: "", yearTo: "" };
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
    makeLabelBySlug,
    modelLabelBySlug,
    parentLabelById,
    setDynamicValues,
    setState,
    state,
    subLabelById,
    text.categoryChip,
    text.cityChip,
    text.conditionChip,
    text.favoritesChip,
    text.maxLabel,
    text.minLabel,
    text.mkd,
    text.makeChip,
    text.modelChip,
    text.priceChip,
    text.searchChip,
    text.subcategoryChip,
    text.yearChip,
    text.yearFrom,
    text.yearTo,
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

    const nextState: BrowseFilterState = {
      ...state,
      cat: nextCat,
      sub: "",
      make: "",
      model: "",
      yearFrom: "",
      yearTo: "",
    };

    setState(nextState);
    setDynamicValues(nextDynamicValues);
    if (isMobileMode) return;
    applyFilters(nextState, nextDynamicValues);
  };

  const onSubcategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSub = event.target.value;
    const nextParent = categories.find((category) =>
      category.children.some((child) => child.id === nextSub),
    );
    const subIsCars = isCarsSlug(nextParent?.slug);
    const nextState: BrowseFilterState = {
      ...state,
      sub: nextSub,
      ...(subIsCars
        ? {}
        : {
            make: "",
            model: "",
            yearFrom: "",
            yearTo: "",
          }),
    };
    setState(nextState);
    if (isMobileMode) return;
    applyFilters(nextState, dynamicValues);
  };

  const onImmediateSelectChange =
    (key: keyof Pick<BrowseFilterState, "city" | "condition" | "sort">) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextState: BrowseFilterState = {
        ...state,
        [key]: event.target.value as BrowseFilterState[typeof key],
      };
      setState(nextState);
      if (isMobileMode) return;
      applyFilters(nextState, dynamicValues);
    };

  const onMakeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextState: BrowseFilterState = {
      ...state,
      make: event.target.value,
      model: "",
    };
    setState(nextState);
    if (isMobileMode) return;
    applyFilters(nextState, dynamicValues);
  };

  const onModelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextState: BrowseFilterState = {
      ...state,
      model: event.target.value,
    };
    setState(nextState);
    if (isMobileMode) return;
    applyFilters(nextState, dynamicValues);
  };

  const onYearChange =
    (key: "yearFrom" | "yearTo") => (event: ChangeEvent<HTMLSelectElement>) => {
      const nextState: BrowseFilterState = {
        ...state,
        [key]: event.target.value,
      };
      setState(nextState);
      if (isMobileMode) return;
      applyFilters(nextState, dynamicValues);
    };

  function renderDynamicInput(template: Template) {
    const value = dynamicValues[template.key] ?? "";
    const commonClasses = "h-10 min-w-0 w-full max-w-full";

    if (template.type === CategoryFieldType.SELECT) {
      return (
        <Select
          name={`df_${template.key}`}
          value={value}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const next = { ...dynamicValues, [template.key]: event.target.value };
            setDynamicValues(next);
            if (isMobileMode) return;
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

  if (isMobileMode) {
    return (
      <div className="max-w-full space-y-4 overflow-x-hidden">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.search}
          </span>
          <Input
            name="q"
            value={state.q}
            onChange={(event) =>
              setState((prev) => ({ ...prev, q: event.target.value }))
            }
            placeholder={text.searchPlaceholder}
            autoComplete="off"
          />
        </label>

        <details className="group rounded-xl border border-border/70 bg-card/70 p-3" open>
          <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.category}
          </summary>
          <div className="mt-3 grid max-w-full gap-3 [&>*]:min-w-0">
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
          </div>
        </details>

        <details className="group rounded-xl border border-border/70 bg-card/70 p-3">
          <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.city}
          </summary>
          <label className="mt-3 block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {text.city}
            </span>
            <Select name="city" value={state.city} onChange={onImmediateSelectChange("city")}>
              <option value="">{text.allCities}</option>
              {cities.map((cityItem) => (
                <option key={cityItem.id} value={cityItem.id}>
                  {cityItem.name}
                </option>
              ))}
            </Select>
          </label>
        </details>

        <details className="group rounded-xl border border-border/70 bg-card/70 p-3">
          <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.priceRange}
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
        </details>

        <details className="group rounded-xl border border-border/70 bg-card/70 p-3">
          <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.condition}
          </summary>
          <div className="mt-3 grid max-w-full gap-3 [&>*]:min-w-0">
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
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {text.orderBy}
              </span>
              <Select
                name="sort"
                value={state.sort}
                onChange={(event) => {
                  const nextState: BrowseFilterState = {
                    ...state,
                    sort: parseBrowseSort(event.target.value),
                  };
                  setState(nextState);
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
            {canUseFavoritesFilter && (
              <button
                type="button"
                className={cn(
                  "inline-flex h-9 w-full items-center justify-center rounded-full border px-3 text-xs font-semibold transition-colors",
                  state.fav === "1"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
                )}
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    fav: prev.fav === "1" ? "" : "1",
                  }))
                }
              >
                {text.favoritesOnly}
              </button>
            )}
          </div>
        </details>

        {isCarsCategorySelected && (
          <details className="group rounded-xl border border-border/70 bg-card/70 p-3">
            <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {text.carsFilters}
            </summary>
            <div className="mt-3 grid max-w-full gap-3 [&>*]:min-w-0">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {text.make}
                </span>
                <Select name="make" value={state.make} onChange={onMakeChange}>
                  <option value="">{text.allMakes}</option>
                  {carMakes.map((make) => (
                    <option key={make.id} value={make.slug}>
                      {make.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {text.model}
                </span>
                <Select
                  name="model"
                  value={state.model}
                  onChange={onModelChange}
                  disabled={!state.make}
                >
                  <option value="">
                    {state.make ? text.allModels : text.selectMakeFirst}
                  </option>
                  {carModelOptions.map((model) => (
                    <option key={model.id} value={model.slug}>
                      {model.name}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {text.yearFrom}
                  </span>
                  <Select
                    name="yearFrom"
                    value={state.yearFrom}
                    onChange={onYearChange("yearFrom")}
                  >
                    <option value="">{text.any}</option>
                    {carYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {text.yearTo}
                  </span>
                  <Select
                    name="yearTo"
                    value={state.yearTo}
                    onChange={onYearChange("yearTo")}
                  >
                    <option value="">{text.any}</option>
                    {carYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            </div>
          </details>
        )}
      </div>
    );
  }

  return (
    <form
      className="max-w-full min-w-0 space-y-4 overflow-x-hidden"
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters(state, dynamicValues);
      }}
    >
      <button type="submit" className="sr-only">
        {text.apply}
      </button>

      {showActiveChips && (hasAnyFilter || activeFilterChips.length > 0) && (
        <BrowseFiltersActiveChips
          chips={activeFilterChips}
          title={text.activeFilters}
          clearAllLabel={clearAllLabel}
          removeFilterLabel={text.removeFilter}
          onClearAll={resetAll}
        />
      )}

      <BrowseDesktopFiltersRow
        searchLabel={text.search}
        searchPlaceholder={text.searchPlaceholder}
        searchValue={state.q}
        onSearchChange={(value) =>
          setState((prev) => ({ ...prev, q: value }))
        }
        orderByLabel={text.orderBy}
        sortOptions={sortOptions}
        sortValue={state.sort}
        onSortChange={(value) => {
          const nextState: BrowseFilterState = {
            ...state,
            sort: value,
          };
          setState(nextState);
          applyFilters(nextState, dynamicValues);
        }}
        filtersLabel={filtersLabel}
        activeFilterCount={activeFilterChips.length}
        onOpenFilters={() => setIsDrawerOpen(true)}
      />

      {isDrawerOpen && (
        <div className="fixed inset-0 z-[95] max-w-[100vw] overflow-hidden">
          <button
            type="button"
            className={uiModal.backdrop}
            aria-label={filtersLabel}
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex h-[88dvh] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-t-2xl border border-border/70 bg-background shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:h-auto md:max-h-none md:w-[min(430px,100vw)] md:rounded-none md:border-y-0 md:border-r-0 md:border-l">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-background px-4 py-3">
              <p className={uiTypography.eyebrow}>
                {filtersLabel}
              </p>
              <div className="flex items-center gap-3">
                {showResetButton && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary hover:underline"
                    onClick={resetAll}
                  >
                    {resetLabel}
                  </button>
                )}
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label={text.clear}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4">
              <section className="min-w-0 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {basicsLabel}
                </p>
                <div className="grid max-w-full gap-3 [&>*]:min-w-0">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">
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
                    <span className="text-xs font-semibold text-muted-foreground">
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
                    <span className="text-xs font-semibold text-muted-foreground">
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
                    <span className="text-xs font-semibold text-muted-foreground">
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

                {canUseFavoritesFilter && (
                  <button
                    type="button"
                    className={cn(
                      "inline-flex h-8 w-full items-center justify-center rounded-full border px-3 text-xs font-semibold transition-colors",
                      state.fav === "1"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => {
                      const nextState: BrowseFilterState = {
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
              </section>

              <section className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {priceLabel}
                </p>
                <div className="grid max-w-full gap-2">
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
                  <p className="text-xs text-warning">{text.priceAutoFixed}</p>
                )}
              </section>

              {isCarsCategorySelected && (
                <section className="min-w-0 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {vehicleDetailsLabel}
                  </p>
                  <div className="grid max-w-full gap-3 [&>*]:min-w-0">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {text.make}
                      </span>
                      <Select name="make" value={state.make} onChange={onMakeChange}>
                        <option value="">{text.allMakes}</option>
                        {carMakes.map((make) => (
                          <option key={make.id} value={make.slug}>
                            {make.name}
                          </option>
                        ))}
                      </Select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {text.model}
                      </span>
                      <Select
                        name="model"
                        value={state.model}
                        onChange={onModelChange}
                        disabled={!state.make}
                      >
                        <option value="">
                          {state.make ? text.allModels : text.selectMakeFirst}
                        </option>
                        {carModelOptions.map((model) => (
                          <option key={model.id} value={model.slug}>
                            {model.name}
                          </option>
                        ))}
                      </Select>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {text.yearFrom}
                        </span>
                        <Select
                          name="yearFrom"
                          value={state.yearFrom}
                          onChange={onYearChange("yearFrom")}
                        >
                          <option value="">{text.any}</option>
                          {carYearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </Select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {text.yearTo}
                        </span>
                        <Select
                          name="yearTo"
                          value={state.yearTo}
                          onChange={onYearChange("yearTo")}
                        >
                          <option value="">{text.any}</option>
                          {carYearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </Select>
                      </label>
                    </div>

                    {carExtraTemplates.map((template) => (
                      <label key={`car-${template.key}`} className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {template.label}
                        </span>
                        {renderDynamicInput(template)}
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {visibleDynamicTemplates.length > 0 && (
                <details className="rounded-xl border border-border/70 bg-card/60 p-3">
                  <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {moreFiltersLabel}
                  </summary>
                  <div className="mt-3 grid max-w-full gap-3 [&>*]:min-w-0">
                    {visibleDynamicTemplates.map((template) => (
                      <label key={template.key} className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {template.label}
                        </span>
                        {renderDynamicInput(template)}
                      </label>
                    ))}
                  </div>
                </details>
              )}
            </div>

            <div className="border-t border-border/70 p-4">
              <Button type="button" className="w-full" onClick={() => setIsDrawerOpen(false)}>
                {text.apply}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
