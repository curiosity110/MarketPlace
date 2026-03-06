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
  void title;
  return (
    <div className="max-w-full space-y-2 overflow-x-hidden">
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
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
            className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium transition-colors hover:bg-background hover:text-primary"
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
