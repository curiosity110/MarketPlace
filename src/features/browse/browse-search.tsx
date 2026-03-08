"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  label?: string;
  placeholder: string;
  value: string;
  filterLabel?: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
};

export function BrowseSearch({
  label,
  placeholder,
  value,
  filterLabel,
  onChange,
  onFilterClick,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{label || placeholder}</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-14 rounded-full bg-card/80 pl-11 pr-4 text-base"
          autoComplete="off"
        />
      </label>

      {onFilterClick && filterLabel ? (
        <Button
          type="button"
          variant="outline"
          className="h-14 shrink-0 gap-2 px-4"
          onClick={onFilterClick}
          aria-label={filterLabel}
        >
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">{filterLabel}</span>
        </Button>
      ) : null}
    </div>
  );
}
