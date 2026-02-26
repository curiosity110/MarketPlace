"use client";

import type { ChangeEvent } from "react";
import * as React from "react";
import {
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
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

type Props = {
  categories: ParentCategory[];
  cities: City[];
  templatesByCategory: Record<string, Template[]>;
};

function setParam(params: URLSearchParams, key: string, value?: string) {
  if (!value) {
    params.delete(key);
    return;
  }
  params.set(key, value);
}

function getInitialDynamicValues(
  sp: URLSearchParams | ReadonlyURLSearchParams,
) {
  const values: Record<string, string> = {};
  for (const [key, value] of sp.entries()) {
    if (!key.startsWith("df_")) continue;
    values[key.slice(3)] = value;
  }
  return values;
}

export function BrowseFilters({ categories, cities, templatesByCategory }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = React.useState(sp.get("q") ?? "");
  const [cat, setCat] = React.useState(sp.get("cat") ?? "");
  const [sub, setSub] = React.useState(sp.get("sub") ?? "");
  const [city, setCity] = React.useState(sp.get("city") ?? "");
  const [condition, setCondition] = React.useState(sp.get("condition") ?? "");
  const [min, setMin] = React.useState(sp.get("min") ?? "");
  const [max, setMax] = React.useState(sp.get("max") ?? "");
  const [sort, setSort] = React.useState(sp.get("sort") ?? "newest");
  const [dynamicValues, setDynamicValues] = React.useState<Record<string, string>>(
    getInitialDynamicValues(sp),
  );

  const searchParamKey = sp.toString();

  React.useEffect(() => {
    const latest = new URLSearchParams(searchParamKey);
    setQ(latest.get("q") ?? "");
    setCat(latest.get("cat") ?? "");
    setSub(latest.get("sub") ?? "");
    setCity(latest.get("city") ?? "");
    setCondition(latest.get("condition") ?? "");
    setMin(latest.get("min") ?? "");
    setMax(latest.get("max") ?? "");
    setSort(latest.get("sort") ?? "newest");
    setDynamicValues(getInitialDynamicValues(latest));
  }, [searchParamKey]);

  const parent = categories.find((category) => category.id === cat);
  const subcategories = parent?.children ?? [];
  const selectedCategoryId = sub || cat;
  const dynamicTemplates = React.useMemo(
    () => templatesByCategory[selectedCategoryId] ?? [],
    [selectedCategoryId, templatesByCategory],
  );

  React.useEffect(() => {
    setDynamicValues((prev) => {
      const allowedKeys = new Set(dynamicTemplates.map((template) => template.key));
      return Object.fromEntries(
        Object.entries(prev).filter(([key]) => allowedKeys.has(key)),
      );
    });
  }, [selectedCategoryId, dynamicTemplates]);

  function apply(overrides?: Partial<Record<string, string>>) {
    const params = new URLSearchParams(sp.toString());

    const nextQ = overrides?.q ?? q;
    const nextCat = overrides?.cat ?? cat;
    const nextSub = overrides?.sub ?? sub;
    const nextCity = overrides?.city ?? city;
    const nextCondition = overrides?.condition ?? condition;
    const nextMin = overrides?.min ?? min;
    const nextMax = overrides?.max ?? max;
    const nextSort = overrides?.sort ?? sort;

    setParam(params, "q", nextQ.trim() || undefined);
    setParam(params, "cat", nextCat || undefined);
    setParam(params, "sub", nextSub || undefined);
    setParam(params, "city", nextCity || undefined);
    setParam(params, "condition", nextCondition || undefined);
    setParam(params, "min", nextMin || undefined);
    setParam(params, "max", nextMax || undefined);
    setParam(params, "sort", nextSort || undefined);

    // Reset all dynamic params and re-apply for selected category.
    [...params.keys()]
      .filter((key) => key.startsWith("df_"))
      .forEach((key) => params.delete(key));
    Object.entries(dynamicValues).forEach(([key, value]) => {
      if (value.trim()) params.set(`df_${key}`, value.trim());
    });

    setParam(params, "page", "1");
    router.push(`/browse?${params.toString()}`);
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
          onChange={(event) =>
            setDynamicValues((prev) => ({
              ...prev,
              [template.key]: event.target.value,
            }))
          }
          className={commonClasses}
        >
          <option value="">Any {template.label.toLowerCase()}</option>
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
          setDynamicValues((prev) => ({
            ...prev,
            [template.key]: event.target.value,
          }))
        }
        className={commonClasses}
        type={template.type === CategoryFieldType.NUMBER ? "number" : "text"}
        placeholder={`Any ${template.label.toLowerCase()}`}
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
            Search
          </span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={14}
            />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Title, model, keyword..."
              className="pl-9"
            />
          </div>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Category
          </span>
          <Select
            value={cat}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              setCat(event.target.value);
              setSub("");
            }}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Subcategory
          </span>
          <Select
            value={sub}
            disabled={!cat}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSub(event.target.value)
            }
          >
            <option value="">
              {cat ? "All subcategories" : "Select category first"}
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
            City
          </span>
          <Select
            value={city}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setCity(event.target.value)
            }
          >
            <option value="">All cities</option>
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
            Condition
          </span>
          <Select
            value={condition}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setCondition(event.target.value)
            }
          >
            <option value="">Any condition</option>
            {Object.values(ListingCondition).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>

        <div className="price-shapes rounded-2xl border border-dashed border-primary/25 bg-orange-50/40 p-3 dark:bg-orange-500/5 md:col-span-2">
          <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CircleDollarSign size={14} />
            Price range
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              type="number"
              step="1"
              min="0"
              value={min}
              onChange={(event) => setMin(event.target.value)}
              placeholder="Min price"
            />
            <Input
              type="number"
              step="1"
              min="0"
              value={max}
              onChange={(event) => setMax(event.target.value)}
              placeholder="Max price"
            />
          </div>
        </div>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sort
          </span>
          <Select
            value={sort}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSort(event.target.value)
            }
          >
            <option value="newest">Newest first</option>
            <option value="price-asc">Price low to high</option>
            <option value="price-desc">Price high to low</option>
          </Select>
        </label>
      </div>

      {dynamicTemplates.length > 0 && (
        <div className="rounded-2xl border border-secondary/20 bg-blue-50/40 p-3 dark:bg-blue-500/5">
          <p className="mb-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Filter size={14} />
            {cat || sub ? "Category specific filters" : "Extra filters"}
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

      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="min-w-28">
          Apply filters
        </Button>
        <Button type="button" variant="outline" onClick={clearAll}>
          Clear all
        </Button>
      </div>
    </form>
  );
}
