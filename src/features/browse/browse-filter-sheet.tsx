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
  inferredCategoryId?: string;
  inferredSubcategoryId?: string;
  inferredCategoryConfidence?: "low" | "medium" | "high";
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
  inferredCategoryId,
  inferredSubcategoryId,
  inferredCategoryConfidence,
  onChange,
  onDynamicValuesChange,
  onApply,
}: Props) {
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
  const isMk = locale === "mk";
  const inferredCategoryLabel = React.useMemo(() => {
    if (!inferredCategoryId) return "";
    const parent = categories.find((category) => category.id === inferredCategoryId);
    if (!inferredSubcategoryId) return parent?.name || "";
    const child =
      parent?.children.find((subcategory) => subcategory.id === inferredSubcategoryId) ||
      categories.flatMap((category) => category.children).find((subcategory) => subcategory.id === inferredSubcategoryId);
    return child?.name || parent?.name || "";
  }, [categories, inferredCategoryId, inferredSubcategoryId]);

  const text = isMk
    ? {
        filters: "Филтри",
        helper:
          inferredCategoryConfidence === "high" && inferredCategoryLabel
            ? `Предлозите се приспособени за ${inferredCategoryLabel}.`
            : "Прво пребарај, па брзо дофинирај со најважните филтри.",
        clearAll: "Исчисти сè",
        apply: "Примени",
        close: "Затвори",
      }
    : {
        filters: "Filters",
        helper:
          inferredCategoryConfidence === "high" && inferredCategoryLabel
            ? `Suggestions are adapted for ${inferredCategoryLabel}.`
            : "Search first, then refine quickly with the most useful filters.",
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
    <div className="fixed inset-0 z-[90] max-w-[100vw] overflow-hidden sm:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/24 backdrop-blur-[2px]"
        aria-label={text.close}
        onClick={onClose}
      />

      <div
        className="absolute inset-x-0 bottom-0 flex h-[86dvh] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-t-[1.6rem] bg-background shadow-[0_24px_64px_-36px_rgba(48,35,24,0.32)] ring-1 ring-black/8 dark:ring-white/10"
        data-mobile-safe-bottom="overlay"
      >
        <div className="sticky top-0 z-10 border-b border-border/35 bg-background/96 px-4 pb-3 pt-2.5 backdrop-blur-xl">
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border/75" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {text.filters}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground/82">{text.helper}</p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={onClose}
              aria-label={text.close}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
          <BrowseFilters
            mode="mobile"
            categories={categories}
            cities={cities}
            templatesByCategory={templatesByCategory}
            carMakes={carMakes}
            locale={locale}
            canUseFavoritesFilter={canUseFavoritesFilter}
            value={value}
            dynamicValues={dynamicValues}
            inferredCategoryId={inferredCategoryId}
            inferredSubcategoryId={inferredSubcategoryId}
            inferredCategoryConfidence={inferredCategoryConfidence}
            onChange={onChange}
            onDynamicValuesChange={onDynamicValuesChange}
          />
        </div>

        <div className="sticky bottom-0 z-10 grid max-w-full grid-cols-2 gap-2 border-t border-border/35 bg-background/96 p-3.5 backdrop-blur-xl [padding-bottom:calc(0.95rem+env(safe-area-inset-bottom,0px))]">
          <Button
            type="button"
            variant="outline"
            className="min-h-12"
            onClick={() => {
              onChange(EMPTY_BROWSE_FILTER_STATE);
              onDynamicValuesChange({});
            }}
          >
            {text.clearAll}
          </Button>
          <Button type="button" className="min-h-12" onClick={onApply}>
            {text.apply}
          </Button>
        </div>
      </div>
    </div>
  );
}
