"use client";

import { X } from "lucide-react";
import type { BrowseActiveFilterChip } from "@/components/browse-filters.types";

type Props = {
  chips: BrowseActiveFilterChip[];
  title: string;
  clearAllLabel: string;
  removeFilterLabel: string;
  onClearAll: () => void;
};

export function BrowseFiltersActiveChips({
  chips,
  title,
  clearAllLabel,
  removeFilterLabel,
  onClearAll,
}: Props) {
  return (
    <div className="max-w-full space-y-2 overflow-x-hidden rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <button
          type="button"
          className="text-xs font-semibold text-primary hover:underline"
          onClick={onClearAll}
        >
          {clearAllLabel}
        </button>
      </div>
      <div className="flex max-w-full min-w-0 flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary"
            onClick={chip.onRemove}
            aria-label={`${removeFilterLabel}: ${chip.label}`}
          >
            <span className="block truncate">{chip.label}</span>
            <X size={13} />
          </button>
        ))}
      </div>
    </div>
  );
}
