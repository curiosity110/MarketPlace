"use client";

import * as React from "react";
import { X } from "lucide-react";
import { BrowseFilters } from "@/components/browse-filters";
import type {
  BrowseCarMake,
  BrowseCity,
  BrowseFilterState,
  BrowseParentCategory,
  BrowseTemplate,
} from "@/features/browse/types";
import { EMPTY_BROWSE_FILTER_STATE } from "@/components/browse-filters.utils";
import { Button } from "@/components/ui/button";
import { uiModal, uiTypography } from "@/components/ui/ui-patterns";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";

type Props = {
  open: boolean;
  onClose: () => void;
  locale: "en" | "mk";
  categories: BrowseParentCategory[];
  cities: BrowseCity[];
  carMakes: BrowseCarMake[];
  templatesByCategory: Record<string, BrowseTemplate[]>;
  canUseFavoritesFilter: boolean;
  value: BrowseFilterState;
  dynamicValues: Record<string, string>;
  onChange: React.Dispatch<React.SetStateAction<BrowseFilterState>>;
  onDynamicValuesChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onApply: () => void;
};

export function BrowseFilterSheet({
  open,
  onClose,
  locale,
  categories,
  cities,
  carMakes,
  templatesByCategory,
  canUseFavoritesFilter,
  value,
  dynamicValues,
  onChange,
  onDynamicValuesChange,
  onApply,
}: Props) {
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
  const isMk = locale === "mk";
  const text = isMk
    ? {
        filters: "Филтри",
        clearAll: "Исчисти сè",
        apply: "Примени",
        close: "Затвори",
      }
    : {
        filters: "Filters",
        clearAll: "Clear all",
        apply: "Apply",
        close: "Close",
      };

  React.useEffect(() => {
    if (!open) return;

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockBodyScroll();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unlockBodyScroll();
      if (previousActiveElementRef.current?.isConnected) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] max-w-[100vw] overflow-hidden">
      <button
        type="button"
        className={uiModal.backdrop}
        aria-label={text.close}
        onClick={onClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 flex h-[88dvh] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-t-[1.8rem] bg-background shadow-[0_24px_64px_-36px_rgba(48,35,24,0.38)] ring-1 ring-black/8 md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-[min(420px,100vw)] md:rounded-none md:ring-l md:ring-t-0 md:ring-r-0 md:ring-b-0 dark:ring-white/10"
        data-mobile-safe-bottom
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background/96 px-4 py-4 backdrop-blur-xl sm:px-5">
          <p className={uiTypography.eyebrow}>{text.filters}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="min-h-10 text-xs font-semibold text-primary hover:underline"
              onClick={() => {
                onChange(EMPTY_BROWSE_FILTER_STATE);
                onDynamicValuesChange({});
              }}
            >
              {text.clearAll}
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
              aria-label={text.close}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">
          <BrowseFilters
            mode="mobile"
            categories={categories}
            cities={cities}
            templatesByCategory={templatesByCategory}
            carMakes={carMakes}
            locale={locale}
            canUseFavoritesFilter={canUseFavoritesFilter}
            showActiveChips={false}
            showResetButton={false}
            value={value}
            dynamicValues={dynamicValues}
            onChange={onChange}
            onDynamicValuesChange={onDynamicValuesChange}
            onApply={onApply}
          />
        </div>

        <div className="sticky bottom-0 z-10 grid max-w-full grid-cols-2 gap-2 border-t border-border/40 bg-background/96 p-4 backdrop-blur-xl sm:p-5">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              onChange(EMPTY_BROWSE_FILTER_STATE);
              onDynamicValuesChange({});
            }}
          >
            {text.clearAll}
          </Button>
          <Button type="button" className="min-h-11" onClick={onApply}>
            {text.apply}
          </Button>
        </div>
      </div>
    </div>
  );
}
