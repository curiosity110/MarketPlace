"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Category = {
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
  categories: Category[];
  cities: City[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = React.useState(sp.get("q") ?? "");
  const [cat, setCat] = React.useState(sp.get("cat") ?? "");
  const [sub, setSub] = React.useState(sp.get("sub") ?? "");
  const [city, setCity] = React.useState(sp.get("city") ?? "");
  const [cond, setCond] = React.useState(sp.get("cond") ?? "");
  const [min, setMin] = React.useState(sp.get("min") ?? "");
  const [max, setMax] = React.useState(sp.get("max") ?? "");
  const [sort, setSort] = React.useState(sp.get("sort") ?? "new");

  React.useEffect(() => {
    // if parent category changes, reset sub if it no longer belongs
    if (!cat) setSub("");
  }, [cat]);

  function apply() {
    const params = new URLSearchParams(sp.toString());
    setParam(params, "q", q.trim() || undefined);
    setParam(params, "cat", cat || undefined);
    setParam(params, "sub", sub || undefined);
    setParam(params, "city", city || undefined);
    setParam(params, "cond", cond || undefined);
    setParam(params, "min", min || undefined);
    setParam(params, "max", max || undefined);
    setParam(params, "sort", sort || undefined);
    setParam(params, "page", "1"); // reset paging on filter change
    router.push(`/browse?${params.toString()}`);
  }

  function clearAll() {
    router.push("/browse");
  }

  const selectedParent = categories.find((c) => c.id === cat);

  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-semibold">Search</div>
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Search listings..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-sm font-semibold">Category</div>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setSub("");
            }}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Subcategory</div>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            disabled={!cat}
          >
            <option value="">{cat ? "All" : "Select category first"}</option>
            {(selectedParent?.children ?? []).map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-sm font-semibold">City</div>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">All</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Condition</div>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={cond}
            onChange={(e) => setCond(e.target.value)}
          >
            <option value="">All</option>
            <option value="NEW">New</option>
            <option value="USED">Used</option>
            <option value="REFURBISHED">Refurbished</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-sm font-semibold">Min €</div>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ""))}
          />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-semibold">Max €</div>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ""))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold">Sort</div>
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="new">Newest</option>
          <option value="price_asc">Price: low → high</option>
          <option value="price_desc">Price: high → low</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={apply}>
          Apply
        </Button>
        <Button variant="outline" onClick={clearAll}>
          Clear
        </Button>
      </div>
    </div>
  );
}
