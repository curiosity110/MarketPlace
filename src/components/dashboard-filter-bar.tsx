"use client";

import * as React from "react";
import {
  BadgeCheck,
  Grid3X3,
  Hourglass,
  LayoutGrid,
  List,
  Pencil,
  Search,
  SlidersHorizontal,
  type LucideIcon,
  Zap,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ListingView = "all" | "active" | "draft" | "expired" | "sold";
type ListingSort = "newest" | "price-asc" | "price-desc";
type ListingLayout = "grid" | "list";

type CategoryItem = {
  id: string;
  label: string;
  count: number;
};

type StatusItem = {
  key: ListingView;
  label: string;
  count: number;
};

type FilterState = {
  cat: string;
  view: ListingView;
  q: string;
  sort: ListingSort;
  layout: ListingLayout;
};

type Labels = {
  filtersTitle: string;
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

type Props = {
  categories: CategoryItem[];
  statuses: StatusItem[];
  current: FilterState;
  labels: Labels;
  onChange?: (patch: Partial<FilterState>) => void;
};

const STATUS_ICONS: Record<ListingView, LucideIcon> = {
  all: LayoutGrid,
  active: Zap,
  draft: Pencil,
  expired: Hourglass,
  sold: BadgeCheck,
};

export function DashboardFilterBar({
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
    (patch: Partial<FilterState>) => {
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
    (patch: Partial<Props["current"]>) => {
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
  ] as const satisfies Array<{ value: ListingSort; label: string }>;

  return (
    <section className="max-w-full min-w-0 overflow-x-hidden lg:sticky lg:top-20 lg:z-20">
      <div className="max-w-full min-w-0 space-y-3 overflow-x-hidden rounded-xl bg-muted/35 p-3 ring-1 ring-black/5 sm:p-3.5 dark:ring-white/10">
        <div className="flex max-w-full min-w-0 items-center justify-between gap-2">
          {!onChange && isPending && (
            <span className="text-xs text-muted-foreground">
              <SlidersHorizontal className="inline-block size-3.5 animate-pulse" />
            </span>
          )}
        </div>

        <div className="grid max-w-full min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0 space-y-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {labels.categoriesLabel}
            </p>
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
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-foreground text-background"
                          : "bg-background/85 text-foreground hover:bg-background",
                      )}
                      onClick={() => applyChange({ cat: category.id })}
                    >
                      <span className="max-w-[12rem] truncate">{category.label}</span>
                      <span
                        className={cn(
                          "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none",
                          isActive
                            ? "bg-background/15 text-background"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-2 lg:justify-self-end">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground lg:text-right">
              {labels.statusLabel}
            </p>
            <div className="overflow-x-auto pb-1 lg:max-w-[380px]">
              <div className="inline-flex min-w-max items-center gap-2 lg:justify-end">
                {statuses.map((status) => {
                  const isActive = current.view === status.key;
                  const Icon = STATUS_ICONS[status.key];
                  return (
                    <button
                      key={status.key}
                      type="button"
                      aria-pressed={isActive}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isActive
                          ? "bg-foreground text-background"
                          : "bg-background/85 text-foreground hover:bg-background",
                        status.count === 0 ? "opacity-65" : "",
                      )}
                      onClick={() => applyChange({ view: status.key })}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      <span className="max-w-[9rem] truncate">{status.label}</span>
                      <span
                        className={cn(
                          "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none",
                          isActive
                            ? "bg-background/15 text-background"
                            : "bg-muted text-muted-foreground",
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
        </div>

        <div className="grid max-w-full min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_200px_auto]">
          <form
            className="flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap"
            onSubmit={(event) => {
              event.preventDefault();
              applyChange({ q: query });
            }}
          >
            <label htmlFor="dashboard-search" className="sr-only">
              {labels.searchLabel}
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="dashboard-search"
                name="dashboard-search"
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
                className="rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                onClick={() => {
                  setQuery("");
                  applyChange({ q: "" });
                }}
              >
                {labels.clearSearch}
              </button>
            ) : null}
          </form>

          <label className="space-y-1">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {labels.sortLabel}
            </span>
            <Select
              id="dashboard-sort"
              name="dashboard-sort"
              value={current.sort}
              onChange={(event) => applyChange({ sort: event.target.value as ListingSort })}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>

          <div className="space-y-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {labels.viewMode}
            </p>
            <div className="inline-flex max-w-full min-w-0 flex-wrap rounded-xl bg-background/80 p-1 ring-1 ring-black/5 dark:ring-white/10">
              <button
                type="button"
                aria-label={labels.gridView}
                aria-pressed={current.layout === "grid"}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors",
                  current.layout === "grid"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => applyChange({ layout: "grid" })}
              >
                <Grid3X3 className="size-3.5" />
                <span>{labels.gridView}</span>
              </button>
              <button
                type="button"
                aria-label={labels.listView}
                aria-pressed={current.layout === "list"}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors",
                  current.layout === "list"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => applyChange({ layout: "list" })}
              >
                <List className="size-3.5" />
                <span>{labels.listView}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
