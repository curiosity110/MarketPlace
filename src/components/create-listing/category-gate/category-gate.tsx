"use client";

import type { KeyboardEvent, RefObject } from "react";
import type { CreateListingCategory } from "@/components/create-listing/types";
import { Input } from "@/components/ui/input";
import { localizeCategoryName } from "@/lib/category-label";

type CategorySearchEntry = {
  category: CreateListingCategory;
  localizedName: string;
  selectable: boolean;
  hasSelectableChildren: boolean;
};

type Props = {
  text: {
    category: string;
    subcategories: string;
    chooseCategoryTitle: string;
    chooseCategoryHint: string;
    categorySearchLabel: string;
    categorySearchPlaceholder: string;
    noCategoryMatch: string;
    noCategoriesAvailable: string;
    needsSubcategory: string;
    noTemplatesForCategory: string;
  };
  locale: "en" | "mk";
  pickerContainerRef: RefObject<HTMLDivElement | null>;
  categoryById: Map<string, CreateListingCategory>;
  categorySearch: string;
  isCategoryDropdownOpen: boolean;
  displayedCategoryResults: CategorySearchEntry[];
  safeActiveCategoryResultIndex: number;
  selectedParentSubcategories: CreateListingCategory[];
  categoriesWithTemplatesLength: number;
  normalizedCategoryQuery: string;
  selectedCreateCategoryId: string;
  resolvedCreateCategoryId: string;
  selectedCategoryTemplatesLength: number;
  onCategorySearchChange: (value: string) => void;
  onCategorySearchFocus: () => void;
  onCategorySearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onCategoryResultHover: (index: number) => void;
  onCategorySelection: (categoryId: string) => void;
  onSetParentAndCategory: (parentId: string, categoryId: string) => void;
};

export function CreateListingCategoryGate({
  text,
  locale,
  pickerContainerRef,
  categoryById,
  categorySearch,
  isCategoryDropdownOpen,
  displayedCategoryResults,
  safeActiveCategoryResultIndex,
  selectedParentSubcategories,
  categoriesWithTemplatesLength,
  normalizedCategoryQuery,
  selectedCreateCategoryId,
  resolvedCreateCategoryId,
  selectedCategoryTemplatesLength,
  onCategorySearchChange,
  onCategorySearchFocus,
  onCategorySearchKeyDown,
  onCategoryResultHover,
  onCategorySelection,
  onSetParentAndCategory,
}: Props) {
  return (
    <section className="mx-auto w-full max-w-2xl space-y-5 rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/30 p-4 shadow-sm sm:p-6">
      <div className="space-y-2">
        <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          {text.category}
        </span>
        <p className="text-lg font-black sm:text-xl">{text.chooseCategoryTitle}</p>
        <p className="text-sm text-muted-foreground">{text.chooseCategoryHint}</p>
      </div>

      <div className="space-y-1" ref={pickerContainerRef}>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {text.categorySearchLabel}
        </span>
        <div className="relative">
          <Input
            value={categorySearch}
            onFocus={onCategorySearchFocus}
            onChange={(event) => onCategorySearchChange(event.target.value)}
            onKeyDown={onCategorySearchKeyDown}
            placeholder={text.categorySearchPlaceholder}
          />

          {isCategoryDropdownOpen ? (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border/80 bg-card p-1 shadow-lg">
              {displayedCategoryResults.length === 0 ? (
                <p className="px-2 py-2 text-sm text-muted-foreground">{text.noCategoryMatch}</p>
              ) : (
                displayedCategoryResults.map((entry, index) => {
                  const parentLabel = entry.category.parentId
                    ? localizeCategoryName(categoryById.get(entry.category.parentId), locale)
                    : "";
                  const isActive = safeActiveCategoryResultIndex === index;
                  return (
                    <button
                      key={`picker-result-${entry.category.id}`}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                        isActive ? "bg-primary/10 text-foreground" : "hover:bg-muted/60"
                      }`}
                      onMouseEnter={() => onCategoryResultHover(index)}
                      onClick={() => onCategorySelection(entry.category.id)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{entry.localizedName}</span>
                        {parentLabel ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {parentLabel}
                          </span>
                        ) : null}
                      </span>
                      {!entry.selectable && entry.hasSelectableChildren ? (
                        <span className="rounded-full border border-border/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {text.subcategories}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          ) : null}
        </div>
      </div>

      {selectedParentSubcategories.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text.subcategories}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedParentSubcategories.map((subcategory) => (
              <button
                key={`subcategory-${subcategory.id}`}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCreateCategoryId === subcategory.id
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/70 bg-card hover:border-primary/35"
                }`}
                onClick={() =>
                  onSetParentAndCategory(subcategory.parentId || subcategory.id, subcategory.id)
                }
              >
                {localizeCategoryName(subcategory, locale)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {categoriesWithTemplatesLength === 0 ? (
        <p className="text-sm text-muted-foreground">{text.noCategoriesAvailable}</p>
      ) : normalizedCategoryQuery && displayedCategoryResults.length === 0 ? (
        <p className="text-sm text-muted-foreground">{text.noCategoryMatch}</p>
      ) : null}

      {!resolvedCreateCategoryId && selectedParentSubcategories.length > 0 ? (
        <p className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground">
          {text.needsSubcategory}
        </p>
      ) : null}

      {selectedCreateCategoryId && selectedCategoryTemplatesLength === 0 ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {text.noTemplatesForCategory}
        </p>
      ) : null}
    </section>
  );
}
