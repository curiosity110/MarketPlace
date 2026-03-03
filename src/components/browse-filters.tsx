"use client";

import type { ChangeEvent } from "react";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryFieldType, ListingCondition } from "@prisma/client";
import { CircleDollarSign, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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

type Props = {
  categories: ParentCategory[];
  cities: City[];
  templatesByCategory: Record<string, Template[]>;
  locale?: "en" | "mk";
};

function setParam(params: URLSearchParams, key: string, value?: string) {
  if (!value) {
    params.delete(key);
    return;
  }
  params.set(key, value);
}

function getInitialDynamicValues(sp: URLSearchParams) {
  const values: Record<string, string> = {};
  for (const [key, value] of sp.entries()) {
    if (!key.startsWith("df_")) continue;
    values[key.slice(3)] = value;
  }
  return values;
}

function parseSort(value: string | null): BrowseSort {
  if (value === "price-asc" || value === "price-desc") return value;
  return "newest";
}

export function BrowseFilters({
  categories,
  cities,
  templatesByCategory,
  locale = "en",
}: Props) {
  const router = useRouter();
  const spReadonly = useSearchParams();

  // Convert readonly params to mutable snapshot
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
      };

  const conditionLabelByValue: Record<ListingCondition, string> = isMk
    ? { NEW: "Ново", USED: "Користено", REFURBISHED: "Рефурбиширано" }
    : { NEW: "New", USED: "Used", REFURBISHED: "Refurbished" };

  const sortOptions: { value: BrowseSort; label: string }[] = [
    { value: "newest", label: text.newest },
    { value: "price-asc", label: text.priceAsc },
    { value: "price-desc", label: text.priceDesc },
  ];

  // Local UI state (controlled inputs)
  const [q, setQ] = React.useState(sp.get("q") ?? "");
  const [cat, setCat] = React.useState(sp.get("cat") ?? "");
  const [sub, setSub] = React.useState(sp.get("sub") ?? "");
  const [city, setCity] = React.useState(sp.get("city") ?? "");
  const [condition, setCondition] = React.useState(sp.get("condition") ?? "");
  const [min, setMin] = React.useState(sp.get("min") ?? "");
  const [max, setMax] = React.useState(sp.get("max") ?? "");
  const [sort, setSort] = React.useState<BrowseSort>(parseSort(sp.get("sort")));
  const [dynamicValues, setDynamicValues] = React.useState<Record<string, string>>(
    getInitialDynamicValues(sp),
  );

  // Sync state when URL changes (back/forward, link clicks, etc.)
  React.useEffect(() => {
    const latest = new URLSearchParams(spString);
    setQ(latest.get("q") ?? "");
    setCat(latest.get("cat") ?? "");
    setSub(latest.get("sub") ?? "");
    setCity(latest.get("city") ?? "");
    setCondition(latest.get("condition") ?? "");
    setMin(latest.get("min") ?? "");
    setMax(latest.get("max") ?? "");
    setSort(parseSort(latest.get("sort")));
    setDynamicValues(getInitialDynamicValues(latest));
  }, [spString]);

  const parent = categories.find((category) => category.id === cat);
  const subcategories = parent?.children ?? [];
  const selectedCategoryId = sub || cat;

  const dynamicTemplates = React.useMemo(
    () => templatesByCategory[selectedCategoryId] ?? [],
    [selectedCategoryId, templatesByCategory],
  );

  // When category changes, drop dynamic filters that don’t belong
  React.useEffect(() => {
    setDynamicValues((prev) => {
      const allowedKeys = new Set(dynamicTemplates.map((t) => t.key));
      return Object.fromEntries(Object.entries(prev).filter(([k]) => allowedKeys.has(k)));
    });
  }, [dynamicTemplates]);

  function apply(overrides?: Partial<Record<string, string>>) {
    const params = new URLSearchParams(spString);

    const nextQ = overrides?.q ?? q;
    const nextCat = overrides?.cat ?? cat;
    const nextSub = overrides?.sub ?? sub;
    const nextCity = overrides?.city ?? city;
    const nextCondition = overrides?.condition ?? condition;
    const nextMin = overrides?.min ?? min;
    const nextMax = overrides?.max ?? max;
    const nextSort = (overrides?.sort as BrowseSort | undefined) ?? sort;

    setParam(params, "q", nextQ.trim() || undefined);
    setParam(params, "cat", nextCat || undefined);
    setParam(params, "sub", nextSub || undefined);
    setParam(params, "city", nextCity || undefined);
    setParam(params, "condition", nextCondition || undefined);
    setParam(params, "min", nextMin || undefined);
    setParam(params, "max", nextMax || undefined);
    setParam(params, "sort", nextSort || undefined);

    // Reset all df_* then re-apply current dynamicValues
    [...params.keys()]
      .filter((key) => key.startsWith("df_"))
      .forEach((key) => params.delete(key));

    Object.entries(dynamicValues).forEach(([key, value]) => {
      const trimmed = value.trim();
      if (trimmed) params.set(`df_${key}`, trimmed);
    });

    // Whenever filters change: go back to page 1
    setParam(params, "page", "1");

    router.push(params.toString() ? `/browse?${params.toString()}` : "/browse");
  }

  function clearAll() {
    setQ("");
    setCat("");
    setSub("");
    setCity("");
    setCondition("");
    setMin("");
    setMax("");
    setSort("newest");
    setDynamicValues({});
    router.push("/browse");
  }

  function renderDynamicInput(template: Template) {
    const value = dynamicValues[template.key] ?? "";
    const commonClasses = "h-10";

    if (template.type === CategoryFieldType.SELECT) {
      return (
        <Select
          value={value}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setDynamicValues((prev) => ({ ...prev, [template.key]: event.target.value }))
          }
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
        value={value}
        onChange={(event) =>
          setDynamicValues((prev) => ({ ...prev, [template.key]: event.target.value }))
        }
        className={commonClasses}
        type={template.type === CategoryFieldType.NUMBER ? "number" : "text"}
        placeholder={`${text.any} ${template.label.toLowerCase()}`}
      />
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.search}
          </span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={14}
            />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={text.searchPlaceholder}
              className="pl-9"
            />
          </div>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.category}
          </span>
          <Select
            value={cat}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const next = event.target.value;
              setCat(next);
              setSub("");
              // optionally auto-apply on category change:
              // apply({ cat: next, sub: "" });
            }}
          >
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
            value={sub}
            disabled={!cat}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setSub(event.target.value)}
          >
            <option value="">{cat ? text.allSubcategories : text.selectCategoryFirst}</option>
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
            value={city}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setCity(event.target.value)}
          >
            <option value="">{text.allCities}</option>
            {cities.map((cityItem) => (
              <option key={cityItem.id} value={cityItem.id}>
                {cityItem.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.condition}
          </span>
          <Select
            value={condition}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setCondition(event.target.value)}
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
            value={sort}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const nextSort = parseSort(event.target.value);
              setSort(nextSort);
              apply({ sort: nextSort });
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>

        <div className="price-shapes rounded-2xl border border-dashed border-primary/25 bg-orange-50/40 p-3 dark:bg-orange-500/5 md:col-span-2">
          <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CircleDollarSign size={14} />
            {text.priceRange}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              type="number"
              step="1"
              min="0"
              value={min}
              onChange={(event) => setMin(event.target.value)}
              placeholder={text.minPrice}
            />
            <Input
              type="number"
              step="1"
              min="0"
              value={max}
              onChange={(event) => setMax(event.target.value)}
              placeholder={text.maxPrice}
            />
          </div>
        </div>
      </div>

      {dynamicTemplates.length > 0 && (
        <div className="rounded-2xl border border-secondary/20 bg-blue-50/40 p-3 dark:bg-blue-500/5">
          <p className="mb-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Filter size={14} />
            {cat || sub ? text.categoryFilters : text.extraFilters}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dynamicTemplates.map((template) => (
              <label key={template.key} className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">{template.label}</span>
                {renderDynamicInput(template)}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="min-w-28">
            {text.apply}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearAll}
          >
            {text.resetFilters}
          </Button>
        </div>
      </div>
    </form>
  );
}
