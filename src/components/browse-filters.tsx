"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListingCondition } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";

type ParentCategory = {
  id: string;
  name: string;
  children: { id: string; name: string }[];
};
type City = { id: string; name: string };

function setParam(params: URLSearchParams, key: string, value?: string) {
  if (!value) params.delete(key);
  else params.set(key, value);
}

export function BrowseFilters({
  categories,
  cities,
}: {
  categories: ParentCategory[];
  cities: City[];
}) {
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

  const parent = categories.find((c) => c.id === cat);
  const subs = parent?.children ?? [];

  function apply(next?: Partial<Record<string, string>>) {
    const params = new URLSearchParams(sp.toString());

    const nextQ = next?.q ?? q;
    const nextCat = next?.cat ?? cat;
    const nextSub = next?.sub ?? sub;
    const nextCity = next?.city ?? city;
    const nextCond = next?.condition ?? condition;
    const nextMin = next?.min ?? min;
    const nextMax = next?.max ?? max;
    const nextSort = next?.sort ?? sort;

    setParam(params, "q", nextQ.trim() || undefined);
    setParam(params, "cat", nextCat || undefined);
    setParam(params, "sub", nextSub || undefined);
    setParam(params, "city", nextCity || undefined);
    setParam(params, "condition", nextCond || undefined);
    setParam(params, "min", nextMin || undefined);
    setParam(params, "max", nextMax || undefined);
    setParam(params, "sort", nextSort || undefined);
    setParam(params, "page", "1");

    router.push(`/browse?${params.toString()}`);
  }

  return (
    <form
      className="grid gap-2 md:grid-cols-10"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title or description"
        className="md:col-span-2"
      />

      <Select
        value={cat}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const v = e.target.value;
          setCat(v);
          setSub(""); // reset sub when parent changes
          apply({ cat: v, sub: "" });
        }}
      >
        <option value="">Any category</option>
        {categories.map((c) => (
          <option value={c.id} key={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select
        value={sub}
        disabled={!cat}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const v = e.target.value;
          setSub(v);
          apply({ sub: v });
        }}
      >
        <option value="">
          {cat ? "Any subcategory" : "Select category first"}
        </option>
        {subs.map((sc) => (
          <option value={sc.id} key={sc.id}>
            {sc.name}
          </option>
        ))}
      </Select>

      <Select
        value={city}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const v = e.target.value;
          setCity(v);
          apply({ city: v });
        }}
      >
        <option value="">Any city</option>
        {cities.map((c) => (
          <option value={c.id} key={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select
        value={condition}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const v = e.target.value;
          setCondition(v);
          apply({ condition: v });
        }}
      >
        <option value="">Any condition</option>
        {Object.values(ListingCondition).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>

      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="Min €"
        value={min}
        onChange={(e) => setMin(e.target.value)}
      />
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="Max €"
        value={max}
        onChange={(e) => setMax(e.target.value)}
      />

      <div className="flex gap-2 md:col-span-2">
        <Select
          value={sort}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const v = e.target.value;
            setSort(v);
            apply({ sort: v });
          }}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price low → high</option>
          <option value="price-desc">Price high → low</option>
        </Select>
        <Button variant="outline" type="submit">
          Apply
        </Button>
      </div>
    </form>
  );
}
