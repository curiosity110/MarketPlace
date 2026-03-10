"use client";

import * as React from "react";
import { CategoryFieldType, ListingCondition } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  BrowseFilterState,
  BrowseFiltersProps,
  BrowseTemplate,
} from "@/components/browse-filters.types";
import {
  areStringRecordsEqual,
  getBrowseDynamicValues,
  getBrowseFilterState,
  isCarExtraTemplate,
  isCarsSlug,
  normalizeNumericInput,
  parseBrowseSort,
} from "@/components/browse-filters.utils";
import { cn } from "@/lib/utils";

function findParentForChild(
  categories: BrowseFiltersProps["categories"],
  childId: string,
) {
  return categories.find((category) => category.children.some((child) => child.id === childId)) ?? null;
}

function FilterSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-[1.2rem] bg-card/72 p-3.5 ring-1 ring-black/5 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] dark:ring-white/10">
      <div className="space-y-1">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </p>
        {hint ? <p className="text-xs leading-5 text-muted-foreground/82">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ChipButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition-colors",
        active
          ? "bg-foreground text-background shadow-[0_10px_18px_-18px_rgba(15,23,42,0.34)]"
          : "bg-muted/36 text-foreground/80 ring-1 ring-black/5 hover:bg-muted/54 dark:ring-white/10",
      )}
    >
      {children}
    </button>
  );
}

export function BrowseFilters({
  categories,
  cities,
  templatesByCategory,
  carMakes,
  locale = "en",
  canUseFavoritesFilter = false,
  mode = "mobile",
  value,
  dynamicValues: controlledDynamicValues,
  onChange,
  onDynamicValuesChange,
  inferredCategoryId,
  inferredSubcategoryId,
  inferredCategoryConfidence,
}: BrowseFiltersProps) {
  void mode;

  const initialParams = React.useMemo(
    () =>
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search),
    [],
  );
  const [internalState, setInternalState] = React.useState<BrowseFilterState>(() =>
    value ?? getBrowseFilterState(initialParams),
  );
  const [internalDynamicValues, setInternalDynamicValues] = React.useState<Record<string, string>>(
    () => controlledDynamicValues ?? getBrowseDynamicValues(initialParams),
  );

  const state = value ?? internalState;
  const dynamicValues = controlledDynamicValues ?? internalDynamicValues;

  const setState = React.useCallback<React.Dispatch<React.SetStateAction<BrowseFilterState>>>(
    (next) => {
      if (onChange) {
        onChange(next);
        return;
      }
      setInternalState(next);
    },
    [onChange],
  );

  const setDynamicValues = React.useCallback<
    React.Dispatch<React.SetStateAction<Record<string, string>>>
  >(
    (next) => {
      if (onDynamicValuesChange) {
        onDynamicValuesChange(next);
        return;
      }
      setInternalDynamicValues(next);
    },
    [onDynamicValuesChange],
  );

  const isMk = locale === "mk";
  const text = isMk
    ? {
        search: "Пребарување",
        searchPlaceholder: "Наслов, модел, клучен збор...",
        searchHint: "Пребарај прво. Потоа дофинирај само ако треба.",
        favoritesOnly: "Само омилени",
        category: "Категорија",
        categoryHint: "Избери ако сакаш попрецизни резултати.",
        allCategories: "Сите категории",
        allSubcategories: "Сите поткатегории",
        selectCategoryFirst: "Избери категорија прво",
        inferredCategory: "Предложено од пребарувањето",
        price: "Цена",
        priceHint: "Постави опсег само ако сакаш побрзо да стесниш.",
        minPrice: "Мин",
        maxPrice: "Макс",
        mkd: "МКД",
        condition: "Состојба",
        anyCondition: "Секоја",
        location: "Локација",
        locationHint: "Избери град ако ти е важна близината.",
        allCities: "Сите градови",
        categorySpecific: "Релевантни детали",
        categorySpecificHint: "Прикажани се само најкорисните филтри за ова пребарување.",
        cars: "Авто детали",
        carsHint: "Прво марка и модел, па дополнителни детали.",
        make: "Марка",
        model: "Модел",
        allMakes: "Сите марки",
        allModels: "Сите модели",
        selectMakeFirst: "Избери марка прво",
        yearFrom: "Од",
        yearTo: "До",
        sort: "Подреди",
        newest: "Најнови",
        priceAsc: "Најниска цена",
        priceDesc: "Највисока цена",
        yes: "Да",
        no: "Не",
        select: "Избери",
        newCondition: "Ново",
        usedCondition: "Користено",
        refurbishedCondition: "Рефурбиширано",
      }
    : {
        search: "Search",
        searchPlaceholder: "Title, model, keyword...",
        searchHint: "Search first. Refine only when you need to.",
        favoritesOnly: "Favorites only",
        category: "Category",
        categoryHint: "Pick one only if you want tighter results.",
        allCategories: "All categories",
        allSubcategories: "All subcategories",
        selectCategoryFirst: "Select category first",
        inferredCategory: "Suggested from your search",
        price: "Price",
        priceHint: "Set a range only when you want faster narrowing.",
        minPrice: "Min",
        maxPrice: "Max",
        mkd: "MKD",
        condition: "Condition",
        anyCondition: "Any",
        location: "Location",
        locationHint: "Choose a city only if distance matters.",
        allCities: "All cities",
        categorySpecific: "Relevant details",
        categorySpecificHint: "Only the most useful refiners for this search are shown.",
        cars: "Car details",
        carsHint: "Start with make and model, then narrow down.",
        make: "Make",
        model: "Model",
        allMakes: "All makes",
        allModels: "All models",
        selectMakeFirst: "Select make first",
        yearFrom: "From",
        yearTo: "To",
        sort: "Sort",
        newest: "Newest",
        priceAsc: "Lowest price",
        priceDesc: "Highest price",
        yes: "Yes",
        no: "No",
        select: "Select",
        newCondition: "New",
        usedCondition: "Used",
        refurbishedCondition: "Refurbished",
      };

  const explicitParent = categories.find((category) => category.id === state.cat) ?? null;
  const explicitSubParent = state.sub ? findParentForChild(categories, state.sub) : null;
  const allowInferredCategoryFilters = inferredCategoryConfidence === "high";
  const inferredParent = allowInferredCategoryFilters && inferredCategoryId
    ? categories.find((category) => category.id === inferredCategoryId) ?? null
    : null;
  const inferredSubParent = allowInferredCategoryFilters && inferredSubcategoryId
    ? findParentForChild(categories, inferredSubcategoryId)
    : null;

  const contextCategoryId =
    state.sub ||
    state.cat ||
    (allowInferredCategoryFilters ? inferredSubcategoryId || inferredCategoryId || "" : "");
  const contextParentSlug =
    (state.sub ? explicitSubParent?.slug : explicitParent?.slug) ||
    (allowInferredCategoryFilters
      ? inferredSubcategoryId
        ? inferredSubParent?.slug
        : inferredParent?.slug
      : undefined) ||
    "";
  const inferredContextLabel =
    (inferredSubcategoryId ? inferredSubParent?.children.find((child) => child.id === inferredSubcategoryId)?.name : undefined) ||
    inferredSubParent?.name ||
    inferredParent?.name ||
    "";
  const isCarsCategorySelected = isCarsSlug(contextParentSlug);
  const dynamicTemplates = React.useMemo(
    () => (contextCategoryId ? templatesByCategory[contextCategoryId] ?? [] : []),
    [contextCategoryId, templatesByCategory],
  );
  const visibleDynamicTemplates = React.useMemo(
    () =>
      isCarsCategorySelected
        ? dynamicTemplates.filter((template) => !isCarExtraTemplate(template))
        : dynamicTemplates,
    [dynamicTemplates, isCarsCategorySelected],
  );
  const carExtraTemplates = React.useMemo(
    () => (isCarsCategorySelected ? dynamicTemplates.filter((template) => isCarExtraTemplate(template)) : []),
    [dynamicTemplates, isCarsCategorySelected],
  );
  const selectedMake = state.make
    ? carMakes.find((make) => make.slug === state.make) ?? null
    : null;
  const carModelOptions = selectedMake?.models ?? [];
  const currentYear = new Date().getFullYear() + 1;
  const carYearOptions = Array.from({ length: currentYear - 1980 + 1 }, (_, index) =>
    String(currentYear - index),
  );

  React.useEffect(() => {
    setDynamicValues((prev) => {
      const allowedKeys = new Set(dynamicTemplates.map((template) => template.key));
      const next = Object.fromEntries(
        Object.entries(prev).filter(([key]) => allowedKeys.has(key)),
      );
      return areStringRecordsEqual(prev, next) ? prev : next;
    });
  }, [dynamicTemplates, setDynamicValues]);

  const renderDynamicInput = (template: BrowseTemplate) => {
    const valueForKey = dynamicValues[template.key] ?? "";

    if (template.type === CategoryFieldType.TEXT) {
      return (
        <Input
          value={valueForKey}
          onChange={(event) =>
            setDynamicValues((prev) => ({ ...prev, [template.key]: event.target.value }))
          }
          placeholder={template.label}
        />
      );
    }

    if (template.type === CategoryFieldType.NUMBER) {
      return (
        <Input
          type="text"
          inputMode="numeric"
          value={valueForKey}
          onChange={(event) =>
            setDynamicValues((prev) => ({
              ...prev,
              [template.key]: normalizeNumericInput(event.target.value),
            }))
          }
          placeholder={template.label}
        />
      );
    }

    if (template.type === CategoryFieldType.BOOLEAN) {
      return (
        <div className="flex flex-wrap gap-2">
          <ChipButton
            active={valueForKey === "true"}
            onClick={() =>
              setDynamicValues((prev) => ({ ...prev, [template.key]: valueForKey === "true" ? "" : "true" }))
            }
          >
            {text.yes}
          </ChipButton>
          <ChipButton
            active={valueForKey === "false"}
            onClick={() =>
              setDynamicValues((prev) => ({ ...prev, [template.key]: valueForKey === "false" ? "" : "false" }))
            }
          >
            {text.no}
          </ChipButton>
        </div>
      );
    }

    return (
      <Select
        value={valueForKey}
        onChange={(event) =>
          setDynamicValues((prev) => ({ ...prev, [template.key]: event.target.value }))
        }
        aria-label={template.label}
      >
        <option value="">{template.label}</option>
        {template.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    );
  };

  return (
    <div className="space-y-3.5">
      <FilterSection title={text.search} hint={text.searchHint}>
        <div className="space-y-2.5">
          <Input
            value={state.q}
            onChange={(event) => setState((prev) => ({ ...prev, q: event.target.value }))}
            placeholder={text.searchPlaceholder}
            autoComplete="off"
          />
          {canUseFavoritesFilter ? (
            <div className="flex flex-wrap gap-2">
              <ChipButton
                active={state.fav === "1"}
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    fav: prev.fav === "1" ? "" : "1",
                  }))
                }
              >
                {text.favoritesOnly}
              </ChipButton>
            </div>
          ) : null}
        </div>
      </FilterSection>

      <FilterSection title={text.category} hint={text.categoryHint}>
        <div className="space-y-2.5">
          {allowInferredCategoryFilters && !state.cat && inferredContextLabel ? (
            <div className="inline-flex min-h-11 items-center rounded-full bg-primary/10 px-3 text-sm font-medium text-primary">
              {text.inferredCategory}: {inferredContextLabel}
            </div>
          ) : null}
          <Select
            value={state.cat}
            aria-label={text.category}
            onChange={(event) => {
              const nextState: BrowseFilterState = {
                ...state,
                cat: event.target.value,
                sub: "",
                make: "",
                model: "",
                yearFrom: "",
                yearTo: "",
              };
              setState(nextState);
              setDynamicValues({});
            }}
          >
            <option value="">{text.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          {(state.cat || (allowInferredCategoryFilters && inferredCategoryId)) ? (
            <Select
              value={state.sub}
              disabled={!state.cat}
              aria-label={text.allSubcategories}
              onChange={(event) => {
                const nextState: BrowseFilterState = {
                  ...state,
                  sub: event.target.value,
                  make: "",
                  model: "",
                  yearFrom: "",
                  yearTo: "",
                };
                setState(nextState);
                setDynamicValues({});
              }}
            >
              <option value="">
                {state.cat ? text.allSubcategories : text.selectCategoryFirst}
              </option>
              {(explicitParent?.children ?? []).map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </FilterSection>

      <FilterSection title={text.price} hint={text.priceHint}>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              value={state.min}
              aria-label={text.minPrice}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  min: normalizeNumericInput(event.target.value),
                }))
              }
              placeholder={text.minPrice}
              className="pr-12"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
              {text.mkd}
            </span>
          </div>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              value={state.max}
              aria-label={text.maxPrice}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  max: normalizeNumericInput(event.target.value),
                }))
              }
              placeholder={text.maxPrice}
              className="pr-12"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
              {text.mkd}
            </span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title={text.condition}>
        <div className="flex flex-wrap gap-2">
          <ChipButton active={!state.condition} onClick={() => setState((prev) => ({ ...prev, condition: "" }))}>
            {text.anyCondition}
          </ChipButton>
          <ChipButton
            active={state.condition === ListingCondition.USED}
            onClick={() =>
              setState((prev) => ({
                ...prev,
                condition: prev.condition === ListingCondition.USED ? "" : ListingCondition.USED,
              }))
            }
          >
            {text.usedCondition}
          </ChipButton>
          <ChipButton
            active={state.condition === ListingCondition.NEW}
            onClick={() =>
              setState((prev) => ({
                ...prev,
                condition: prev.condition === ListingCondition.NEW ? "" : ListingCondition.NEW,
              }))
            }
          >
            {text.newCondition}
          </ChipButton>
          <ChipButton
            active={state.condition === ListingCondition.REFURBISHED}
            onClick={() =>
              setState((prev) => ({
                ...prev,
                condition:
                  prev.condition === ListingCondition.REFURBISHED ? "" : ListingCondition.REFURBISHED,
              }))
            }
          >
            {text.refurbishedCondition}
          </ChipButton>
        </div>
      </FilterSection>

      <FilterSection title={text.location} hint={text.locationHint}>
        <Select
          value={state.city}
          aria-label={text.location}
          onChange={(event) =>
            setState((prev) => ({
              ...prev,
              city: event.target.value,
            }))
          }
        >
          <option value="">{text.allCities}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </Select>
      </FilterSection>

      {isCarsCategorySelected ? (
        <FilterSection title={text.cars} hint={text.carsHint}>
          <div className="space-y-2.5">
            <Select
              value={state.make}
              aria-label={text.make}
              onChange={(event) => {
                const nextMake = event.target.value;
                setState((prev) => ({
                  ...prev,
                  make: nextMake,
                  model: "",
                }));
              }}
            >
              <option value="">{text.allMakes}</option>
              {carMakes.map((make) => (
                <option key={make.id} value={make.slug}>
                  {make.name}
                </option>
              ))}
            </Select>

            <Select
              value={state.model}
              disabled={!state.make}
              aria-label={text.model}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  model: event.target.value,
                }))
              }
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

            <div className="grid grid-cols-2 gap-2.5">
              <Select
                value={state.yearFrom}
                aria-label={text.yearFrom}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    yearFrom: event.target.value,
                  }))
                }
              >
                <option value="">{text.yearFrom}</option>
                {carYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>

              <Select
                value={state.yearTo}
                aria-label={text.yearTo}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    yearTo: event.target.value,
                  }))
                }
              >
                <option value="">{text.yearTo}</option>
                {carYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>

            {carExtraTemplates.map((template) => (
              <div key={template.key} className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">{template.label}</span>
                {renderDynamicInput(template)}
              </div>
            ))}
          </div>
        </FilterSection>
      ) : null}

      {!isCarsCategorySelected && visibleDynamicTemplates.length > 0 ? (
        <FilterSection title={text.categorySpecific} hint={text.categorySpecificHint}>
          <div className="space-y-2.5">
            {visibleDynamicTemplates.map((template) => (
              <div key={template.key} className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">{template.label}</span>
                {renderDynamicInput(template)}
              </div>
            ))}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection title={text.sort}>
        <div className="flex flex-wrap gap-2">
          <ChipButton
            active={state.sort === "newest"}
            onClick={() => setState((prev) => ({ ...prev, sort: parseBrowseSort("newest") }))}
          >
            {text.newest}
          </ChipButton>
          <ChipButton
            active={state.sort === "price-asc"}
            onClick={() => setState((prev) => ({ ...prev, sort: parseBrowseSort("price-asc") }))}
          >
            {text.priceAsc}
          </ChipButton>
          <ChipButton
            active={state.sort === "price-desc"}
            onClick={() => setState((prev) => ({ ...prev, sort: parseBrowseSort("price-desc") }))}
          >
            {text.priceDesc}
          </ChipButton>
        </div>
      </FilterSection>
    </div>
  );
}
