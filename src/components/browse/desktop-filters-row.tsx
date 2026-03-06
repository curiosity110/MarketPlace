"use client";

import { Filter } from "lucide-react";
import { BrowseSearchBar } from "@/components/browse/search-bar";
import type { BrowseSort } from "@/components/browse/filters.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="grid max-w-full min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-end lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)_auto]">
      <BrowseSearchBar
        label={searchLabel}
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={onSearchChange}
      />

      <div className="min-w-0 max-w-full space-y-1 md:w-full md:max-w-[26rem]">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {orderByLabel}
        </p>
        <div className="flex w-full max-w-full min-w-0 rounded-xl border border-border/80 bg-muted/20 p-1">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "h-8 min-w-0 flex-1 truncate rounded-lg px-2 text-xs font-semibold transition-colors",
                sortValue === option.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onSortChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 max-w-full space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {filtersLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full min-w-0 max-w-full rounded-xl px-3 md:w-auto"
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
