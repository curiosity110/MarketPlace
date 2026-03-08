"use client";

import { cn } from "@/lib/utils";

type CategoryItem = {
  id: string;
  name: string;
};

type Props = {
  allLabel: string;
  categories: CategoryItem[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
};

export function BrowseCategoryTabs({
  allLabel,
  categories,
  activeCategoryId,
  onSelect,
}: Props) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex min-w-max items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={cn(
            "rounded-full px-4 py-2 text-sm transition-colors",
            activeCategoryId
              ? "text-muted-foreground hover:text-foreground"
              : "bg-foreground text-background",
          )}
        >
          {allLabel}
        </button>

        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
