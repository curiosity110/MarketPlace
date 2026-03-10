"use client";

import { ArrowDownUp } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { BrowseSort } from "@/features/browse/types";

export type BrowseVisibleSort = BrowseSort | "relevance";

type Props = {
  locale: "en" | "mk";
  value: BrowseVisibleSort;
  hasQuery: boolean;
  onChange: (value: BrowseVisibleSort) => void;
};

export function BrowseSort({ locale, value, hasQuery, onChange }: Props) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        sort: "Подреди",
        relevance: "Релевантни",
        newest: "Најнови",
        priceAsc: "Најниска цена",
        priceDesc: "Највисока цена",
      }
    : {
        sort: "Sort",
        relevance: "Relevance",
        newest: "Newest",
        priceAsc: "Lowest price",
        priceDesc: "Highest price",
      };

  return (
    <label className="block min-w-0">
      <span className="sr-only">{text.sort}</span>
      <div className="relative">
        <ArrowDownUp
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/75"
        />
        <Select
          value={value}
          onChange={(event) => onChange(event.target.value as BrowseVisibleSort)}
          className="h-10.5 min-w-[9.75rem] rounded-full border-border/35 bg-card/72 pl-9 pr-8 text-sm shadow-[0_10px_22px_-24px_rgba(15,23,42,0.24)]"
        >
          {hasQuery ? <option value="relevance">{text.relevance}</option> : null}
          <option value="newest">{text.newest}</option>
          <option value="price-asc">{text.priceAsc}</option>
          <option value="price-desc">{text.priceDesc}</option>
        </Select>
      </div>
    </label>
  );
}
