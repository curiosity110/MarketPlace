"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type BrowseSearchProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
};

export function BrowseSearch({
  searchValue,
  onSearchChange,
  onFilterClick,
}: BrowseSearchProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Search input - dominant */}
      <label className="relative flex-1 min-w-0">
        <span className="sr-only">Search listings</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search..."
          className="h-10 rounded-lg bg-card pl-10 text-sm"
          autoComplete="off"
        />
      </label>

      {/* Filter toggle - subtle icon button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-foreground"
        onClick={onFilterClick}
        aria-label="Open filters"
      >
        <SlidersHorizontal size={18} />
      </Button>
    </div>
  );
}
