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
    <div className="-mx-1 overflow-x-auto px-1 pb-0.5 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex min-w-max items-center gap-2 pr-3">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={cn(
            "h-8.5 rounded-full px-3 text-[12px] font-medium tracking-[-0.01em] transition-colors",
            activeCategoryId
              ? "bg-muted/42 text-foreground/70 ring-1 ring-black/5 hover:bg-muted/60 dark:ring-white/10"
              : "bg-foreground text-background shadow-[0_12px_22px_-18px_rgba(15,23,42,0.42)]",
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
                "h-8.5 rounded-full px-3 text-[12px] font-medium tracking-[-0.01em] transition-colors",
                isActive
                  ? "bg-foreground text-background shadow-[0_12px_22px_-18px_rgba(15,23,42,0.42)]"
                  : "bg-muted/35 text-foreground/72 ring-1 ring-black/5 hover:bg-muted/55 dark:ring-white/10",
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
