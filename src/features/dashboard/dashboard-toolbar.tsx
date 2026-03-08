"use client";

import * as React from "react";
import { Grid3X3, List, Search, type LucideIcon, BadgeCheck, Hourglass, LayoutGrid, Pencil, Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  DashboardCategoryFilterItem,
  DashboardFilterState,
  DashboardLayout,
  DashboardSort,
  DashboardStatusFilterItem,
  DashboardView,
} from "@/features/dashboard/types";

type Props = {
  categories: DashboardCategoryFilterItem[];
  statuses: DashboardStatusFilterItem[];
  current: DashboardFilterState;
  labels: {
    categoriesLabel: string;
    statusLabel: string;
    searchLabel: string;
    searchPlaceholder: string;
    clearSearch: string;
    sortLabel: string;
    sortNewest: string;
    sortPriceLowHigh: string;
    sortPriceHighLow: string;
    viewMode: string;
    gridView: string;
    listView: string;
  };
  onChange?: (patch: Partial<DashboardFilterState>) => void;
};

const STATUS_ICONS: Record<DashboardView, LucideIcon> = {
  all: LayoutGrid,
  active: Zap,
  draft: Pencil,
  expired: Hourglass,
  sold: BadgeCheck,
};

export function DashboardToolbar({
  categories,
  statuses,
  current,
  labels,
  onChange,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = React.useState(current.q);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setQuery(current.q);
  }, [current.q]);

  const navigateWithUrl = React.useCallback(
    (patch: Partial<DashboardFilterState>) => {
      const next = { ...current, ...patch };
      const params = new URLSearchParams();
      params.set("cat", next.cat || "all");
      params.set("view", next.view);

      const trimmedQuery = next.q.trim();
      if (trimmedQuery) params.set("q", trimmedQuery);
      if (next.sort !== "newest") params.set("sort", next.sort);
      if (next.layout !== "grid") params.set("layout", next.layout);

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [current, pathname, router],
  );

  const applyChange = React.useCallback(
    (patch: Partial<DashboardFilterState>) => {
      if (onChange) {
        onChange(patch);
        return;
      }
      startTransition(() => navigateWithUrl(patch));
    },
    [navigateWithUrl, onChange],
  );

  const sortOptions = [
    { value: "newest", label: labels.sortNewest },
    { value: "price-asc", label: labels.sortPriceLowHigh },
    { value: "price-desc", label: labels.sortPriceHighLow },
  ] as const satisfies Array<{ value: DashboardSort; label: string }>;

  return (
    <div className="space-y-4 rounded-[1.35rem] border border-border/45 bg-card/68 p-3.5 sm:rounded-[1.6rem] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="overflow-x-auto pb-1">
          <div className="inline-flex min-w-max items-center gap-2">
            {categories.map((category) => {
              const isActive = current.cat === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors",
                    isActive ? "bg-foreground text-background" : "bg-background/75 text-foreground",
                  )}
                  onClick={() => applyChange({ cat: category.id })}
                >
                  <span className="max-w-[12rem] truncate">{category.label}</span>
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                      isActive ? "bg-background/15 text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="inline-flex min-w-max items-center gap-2">
            {statuses.map((status) => {
              const isActive = current.view === status.key;
              const Icon = STATUS_ICONS[status.key];
              return (
                <button
                  key={status.key}
                  type="button"
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors",
                    isActive ? "bg-foreground text-background" : "bg-background/75 text-foreground",
                    status.count === 0 ? "opacity-65" : "",
                  )}
                  onClick={() => applyChange({ view: status.key })}
                >
                  <Icon className="size-3.5" />
                  <span>{status.label}</span>
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                      isActive ? "bg-background/15 text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {status.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
        <form
          className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-nowrap sm:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            applyChange({ q: query });
          }}
        >
          <label htmlFor="dashboard-search" className="sr-only">
            {labels.searchLabel}
          </label>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="dashboard-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.searchPlaceholder}
              className="pl-9"
              autoComplete="off"
            />
          </div>
          {current.q ? (
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground sm:text-center"
              onClick={() => {
                setQuery("");
                applyChange({ q: "" });
              }}
            >
              {labels.clearSearch}
            </button>
          ) : null}
          {!onChange && isPending ? <span className="text-xs text-muted-foreground">...</span> : null}
        </form>

        <Select
          value={current.sort}
          onChange={(event) => applyChange({ sort: event.target.value as DashboardSort })}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <div className="inline-flex w-full rounded-full bg-background p-1 ring-1 ring-border/50 sm:w-auto">
          <button
            type="button"
            aria-pressed={current.layout === "grid"}
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors sm:flex-none",
              current.layout === "grid" ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
            onClick={() => applyChange({ layout: "grid" as DashboardLayout })}
          >
            <Grid3X3 className="size-3.5" />
            <span>{labels.gridView}</span>
          </button>
          <button
            type="button"
            aria-pressed={current.layout === "list"}
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors sm:flex-none",
              current.layout === "list" ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
            onClick={() => applyChange({ layout: "list" as DashboardLayout })}
          >
            <List className="size-3.5" />
            <span>{labels.listView}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
