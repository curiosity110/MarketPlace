"use client";

import { Filter } from "lucide-react";
import { BrowseSearchBar } from "@/components/browse/search-bar";
import type { BrowseSort } from "@/components/browse/filters.types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type SortOption = {
  value: BrowseSort;
  label: string;
};

type Props = {
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  orderByLabel: string;
  sortOptions: SortOption[];
  sortValue: BrowseSort;
  onSortChange: (value: BrowseSort) => void;
  filtersLabel: string;
  activeFilterCount: number;
  onOpenFilters: () => void;
};

export function BrowseDesktopFiltersRow({
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  orderByLabel,
  sortOptions,
  sortValue,
  onSortChange,
  filtersLabel,
  activeFilterCount,
  onOpenFilters,
}: Props) {
  return (
    <div className="grid max-w-full min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_200px_auto] md:items-end">
      <BrowseSearchBar
        label={searchLabel}
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={onSearchChange}
      />

      <div className="min-w-0 max-w-full space-y-1">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {orderByLabel}
        </p>
        <Select
          name="sort"
          value={sortValue}
          onChange={(event) => onSortChange(event.target.value as BrowseSort)}
          className="h-11 rounded-2xl bg-card"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="min-w-0 max-w-full space-y-1">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {filtersLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full min-w-0 max-w-full rounded-2xl px-3 md:w-auto"
          onClick={onOpenFilters}
        >
          <Filter size={14} className="mr-1.5" />
          <span className="truncate">
            {filtersLabel}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </span>
        </Button>
      </div>
    </div>
  );
}
