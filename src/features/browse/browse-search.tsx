"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  label?: string;
  placeholder: string;
  value: string;
  filterLabel?: string;
  clearLabel?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onFilterClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function BrowseSearch({
  label,
  placeholder,
  value,
  filterLabel,
  clearLabel,
  onChange,
  onClear,
  onFilterClick,
  onFocus,
  onBlur,
}: Props) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{label || placeholder}</span>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/85"
          size={17}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className="h-12 rounded-full border-border/40 bg-card/80 pl-10 pr-11 text-[15px] shadow-[0_14px_28px_-26px_rgba(15,23,42,0.24)] focus:border-foreground/10 focus:ring-2 focus:ring-black/4 dark:focus:ring-white/8"
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            aria-label={clearLabel || "Clear search"}
          >
            <X size={16} />
          </button>
        ) : null}
      </label>

      {onFilterClick && filterLabel ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 min-w-11 shrink-0 gap-2 rounded-full border-border/40 bg-card/68 px-3 text-foreground/82 shadow-[0_10px_22px_-24px_rgba(15,23,42,0.24)]"
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
