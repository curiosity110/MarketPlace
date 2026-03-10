"use client";

import { cn } from "@/lib/utils";

type Shortcut = {
  id: string;
  name: string;
};

type Props = {
  locale: "en" | "mk";
  allLabel: string;
  categories: Shortcut[];
  activeCategoryId: string;
  hasQuery: boolean;
  onSelect: (categoryId: string) => void;
};

export function BrowseCategoryShortcuts({
  locale,
  allLabel,
  categories,
  activeCategoryId,
  hasQuery,
  onSelect,
}: Props) {
  void locale;

  if (categories.length === 0) return null;

  return (
    <div
      className={cn(
        "-mx-1 overflow-x-auto px-1 pb-0.5 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        hasQuery && "pb-0",
      )}
    >
      <div className={cn("inline-flex min-w-max items-center pr-3", hasQuery ? "gap-1.5" : "gap-2")}>
        <button
          type="button"
          onClick={() => onSelect("")}
          className={cn(
            "rounded-full px-3 text-[12px] font-medium transition-colors",
            hasQuery ? "h-7.5" : "h-8",
            activeCategoryId
              ? "bg-muted/28 text-foreground/68 ring-1 ring-black/5 hover:bg-muted/45 dark:ring-white/10"
              : "bg-foreground text-background shadow-[0_10px_18px_-18px_rgba(15,23,42,0.42)]",
            hasQuery && "opacity-75",
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
                "rounded-full px-3 text-[12px] font-medium transition-colors",
                hasQuery ? "h-7.5" : "h-8",
                isActive
                  ? "bg-foreground text-background shadow-[0_10px_18px_-18px_rgba(15,23,42,0.42)]"
                  : "bg-muted/24 text-foreground/70 ring-1 ring-black/5 hover:bg-muted/42 dark:ring-white/10",
                hasQuery && !isActive && "opacity-72",
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
