"use client";

import type { ChangeEvent } from "react";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListingCondition } from "@prisma/client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

type Props = {
  categories: CategoryOption[];
  cities: CityOption[];
  carMakes: CarMakeOption[];
  locale?: "en" | "mk";
};

type MobileFilterState = {
  q: string;
  cat: string;
  sub: string;
  city: string;
  condition: string;
  min: string;
  max: string;
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
};

function isCarsSlug(slug: string | undefined) {
  if (!slug) return false;
  const normalized = slug.toLowerCase();
  return normalized === "cars" || normalized.includes("car");
}

function normalizeNumericInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function normalizeRange(minRaw: string, maxRaw: string) {
  const min = minRaw.trim();
  const max = maxRaw.trim();
  if (!min || !max) return { min, max };
  const minNum = Number(min);
  const maxNum = Number(max);
  if (!Number.isFinite(minNum) || !Number.isFinite(maxNum)) return { min, max };
  if (minNum <= maxNum) return { min, max };
  return { min: String(maxNum), max: String(minNum) };
}

function normalizeYearRange(yearFromRaw: string, yearToRaw: string) {
  const yearFrom = yearFromRaw.trim();
  const yearTo = yearToRaw.trim();
  if (!yearFrom || !yearTo) return { yearFrom, yearTo };
  const from = Number(yearFrom);
  const to = Number(yearTo);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return { yearFrom, yearTo };
  if (from <= to) return { yearFrom, yearTo };
  return { yearFrom: String(to), yearTo: String(from) };
}

function getInitialState(sp: URLSearchParams): MobileFilterState {
  return {
    q: sp.get("q") ?? "",
    cat: sp.get("cat") ?? "",
    sub: sp.get("sub") ?? "",
    city: sp.get("city") ?? "",
    condition: sp.get("condition") ?? sp.get("cond") ?? "",
    min: sp.get("min") ?? "",
    max: sp.get("max") ?? "",
    make: sp.get("make") ?? "",
    model: sp.get("model") ?? "",
    yearFrom: sp.get("yearFrom") ?? "",
    yearTo: sp.get("yearTo") ?? "",
  };
}

export function MobileFilterSheet({
  categories,
  cities,
  carMakes,
  locale = "en",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spString = searchParams.toString();
  const sp = React.useMemo(() => new URLSearchParams(spString), [spString]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [state, setState] = React.useState<MobileFilterState>(() => getInitialState(sp));

  const isMk = locale === "mk";
  const text = isMk
    ? {
        search: "Пребарување",
        searchPlaceholder: "Наслов, модел, клучен збор...",
        filters: "Филтри",
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
        make: "Марка",
        model: "Модел",
        allMakes: "Сите марки",
        allModels: "Сите модели",
        selectMakeFirst: "Прво избери марка",
        yearFrom: "Година од",
        yearTo: "Година до",
        carsFilters: "Филтри за коли",
        clearAll: "Исчисти сѐ",
        apply: "Примени",
        close: "Затвори",
      }
    : {
        search: "Search",
        searchPlaceholder: "Title, model, keyword...",
        filters: "Filters",
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
        make: "Make",
        model: "Model",
        allMakes: "All makes",
        allModels: "All models",
        selectMakeFirst: "Select make first",
        yearFrom: "Year from",
        yearTo: "Year to",
        carsFilters: "Cars filters",
        clearAll: "Clear all",
        apply: "Apply",
        close: "Close",
      };

  const conditionLabelByValue = React.useMemo<Record<ListingCondition, string>>(
    () =>
      isMk
        ? { NEW: "Ново", USED: "Користено", REFURBISHED: "Рефурбиширано" }
        : { NEW: "New", USED: "Used", REFURBISHED: "Refurbished" },
    [isMk],
  );

  React.useEffect(() => {
    if (!isOpen) return;
    setState(getInitialState(new URLSearchParams(spString)));
  }, [isOpen, spString]);

  React.useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const parent = categories.find((category) => category.id === state.cat);
  const subcategories = parent?.children ?? [];
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
  const modelOptions = selectedMake?.models ?? [];

  const currentYear = new Date().getFullYear() + 1;
  const yearOptions = React.useMemo(
    () =>
      Array.from({ length: currentYear - 1980 + 1 }, (_, index) =>
        String(currentYear - index),
      ),
    [currentYear],
  );

  React.useEffect(() => {
    if (isCarsCategorySelected) return;
    if (!state.make && !state.model && !state.yearFrom && !state.yearTo) return;
    setState((prev) => ({
      ...prev,
      make: "",
      model: "",
      yearFrom: "",
      yearTo: "",
    }));
  }, [isCarsCategorySelected, state.make, state.model, state.yearFrom, state.yearTo]);

  React.useEffect(() => {
    if (!state.make && state.model) {
      setState((prev) => ({ ...prev, model: "" }));
      return;
    }
    if (!state.make || !state.model) return;
    if (!modelOptions.some((model) => model.slug === state.model)) {
      setState((prev) => ({ ...prev, model: "" }));
    }
  }, [modelOptions, state.make, state.model]);

  const applyFilters = () => {
    const params = new URLSearchParams(spString);
    const managedKeys = [
      "q",
      "cat",
      "sub",
      "city",
      "condition",
      "cond",
      "min",
      "max",
      "make",
      "model",
      "yearFrom",
      "yearTo",
      "page",
    ];
    managedKeys.forEach((key) => params.delete(key));

    const normalizedPrice = normalizeRange(state.min, state.max);
    const normalizedYear = normalizeYearRange(state.yearFrom, state.yearTo);

    if (state.q.trim()) params.set("q", state.q.trim());
    if (state.cat) params.set("cat", state.cat);
    if (state.sub) params.set("sub", state.sub);
    if (state.city) params.set("city", state.city);
    if (state.condition) params.set("condition", state.condition);
    if (normalizedPrice.min) params.set("min", normalizedPrice.min);
    if (normalizedPrice.max) params.set("max", normalizedPrice.max);

    if (isCarsCategorySelected) {
      if (state.make) params.set("make", state.make);
      if (state.model) params.set("model", state.model);
      if (normalizedYear.yearFrom) params.set("yearFrom", normalizedYear.yearFrom);
      if (normalizedYear.yearTo) params.set("yearTo", normalizedYear.yearTo);
    }

    params.set("page", "1");
    const query = params.toString();
    router.replace(query ? `/browse?${query}` : "/browse", { scroll: false });
    setIsOpen(false);
  };

  const clearAll = () => {
    const params = new URLSearchParams(spString);
    [
      "q",
      "cat",
      "sub",
      "city",
      "condition",
      "cond",
      "min",
      "max",
      "make",
      "model",
      "yearFrom",
      "yearTo",
      "page",
    ].forEach((key) => params.delete(key));
    const query = params.toString();
    router.replace(query ? `/browse?${query}` : "/browse", { scroll: false });
    setState({
      q: "",
      cat: "",
      sub: "",
      city: "",
      condition: "",
      min: "",
      max: "",
      make: "",
      model: "",
      yearFrom: "",
      yearTo: "",
    });
  };

  const onCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCat = event.target.value;
    setState((prev) => ({
      ...prev,
      cat: nextCat,
      sub: "",
      make: "",
      model: "",
      yearFrom: "",
      yearTo: "",
    }));
  };

  const onSubcategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSub = event.target.value;
    const nextParent = categories.find((category) =>
      category.children.some((child) => child.id === nextSub),
    );
    const subIsCars = isCarsSlug(nextParent?.slug);

    setState((prev) => ({
      ...prev,
      sub: nextSub,
      ...(subIsCars
        ? {}
        : {
            make: "",
            model: "",
            yearFrom: "",
            yearTo: "",
          }),
    }));
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 flex-1 items-center gap-2 rounded-xl border border-border bg-input px-3 text-left text-sm text-foreground transition-colors hover:border-primary/25"
          onClick={() => setIsOpen(true)}
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

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {text.search}
                </span>
                <Input
                  value={state.q}
                  onChange={(event) =>
                    setState((prev) => ({ ...prev, q: event.target.value }))
                  }
                  placeholder={text.searchPlaceholder}
                  autoComplete="off"
                />
              </label>

              <div className="grid grid-cols-1 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {text.category}
                  </span>
                  <Select value={state.cat} onChange={onCategoryChange}>
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
                    value={state.sub}
                    onChange={onSubcategoryChange}
                    disabled={!state.cat}
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
                    value={state.city}
                    onChange={(event) =>
                      setState((prev) => ({ ...prev, city: event.target.value }))
                    }
                  >
                    <option value="">{text.allCities}</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {text.condition}
                  </span>
                  <Select
                    value={state.condition}
                    onChange={(event) =>
                      setState((prev) => ({ ...prev, condition: event.target.value }))
                    }
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {text.priceRange}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Input
                      value={state.min}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          min: normalizeNumericInput(event.target.value),
                        }))
                      }
                      placeholder={text.minPrice}
                      className="pr-12"
                      inputMode="numeric"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
                      {text.mkd}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      value={state.max}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          max: normalizeNumericInput(event.target.value),
                        }))
                      }
                      placeholder={text.maxPrice}
                      className="pr-12"
                      inputMode="numeric"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
                      {text.mkd}
                    </span>
                  </div>
                </div>
              </div>

              {isCarsCategorySelected && (
                <div className="rounded-2xl border border-secondary/20 bg-blue-50/40 p-3 dark:bg-blue-500/5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {text.carsFilters}
                  </p>
                  <div className="space-y-3">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {text.make}
                      </span>
                      <Select
                        value={state.make}
                        onChange={(event) =>
                          setState((prev) => ({
                            ...prev,
                            make: event.target.value,
                            model: "",
                          }))
                        }
                      >
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
                        value={state.model}
                        onChange={(event) =>
                          setState((prev) => ({ ...prev, model: event.target.value }))
                        }
                        disabled={!state.make}
                      >
                        <option value="">
                          {state.make ? text.allModels : text.selectMakeFirst}
                        </option>
                        {modelOptions.map((model) => (
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
                          value={state.yearFrom}
                          onChange={(event) =>
                            setState((prev) => ({
                              ...prev,
                              yearFrom: event.target.value,
                            }))
                          }
                        >
                          <option value="">-</option>
                          {yearOptions.map((year) => (
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
                          value={state.yearTo}
                          onChange={(event) =>
                            setState((prev) => ({ ...prev, yearTo: event.target.value }))
                          }
                        >
                          <option value="">-</option>
                          {yearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </Select>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-10 grid grid-cols-2 gap-2 border-t border-border/70 bg-background p-4">
              <Button type="button" variant="outline" onClick={clearAll}>
                {text.clearAll}
              </Button>
              <Button type="button" onClick={applyFilters} className={cn("font-semibold")}>
                {text.apply}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
