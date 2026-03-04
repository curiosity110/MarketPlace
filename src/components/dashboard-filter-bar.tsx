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

      router.push(`${pathname}?${params.toString()}`);
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
    <section className="lg:sticky lg:top-20 lg:z-20">
      <div className="space-y-4 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{labels.filtersTitle}</p>
          {!onChange && isPending && (
            <span className="text-xs text-muted-foreground">
              <SlidersHorizontal className="inline-block size-3.5 animate-pulse" />
            </span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border/80 bg-card text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
                      )}
                      onClick={() => applyChange({ cat: category.id })}
                    >
                      <span>{category.label}</span>
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-black leading-none",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-foreground",
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

          <div className="space-y-2 lg:justify-self-end">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:text-right">
              {labels.statusLabel}
            </p>
            <div className="flex flex-wrap justify-start gap-3 lg:max-w-[340px] lg:justify-end">
              {statuses.map((status) => {
                const isActive = current.view === status.key;
                const Icon = STATUS_ICONS[status.key];
                return (
                  <button
                    key={status.key}
                    type="button"
                    aria-pressed={isActive}
                    aria-label={status.label}
                    className={cn(
                      "group relative flex flex-col items-center gap-1 rounded-md p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                    onClick={() => applyChange({ view: status.key })}
                  >
                    <span
                      className={cn(
                        "relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary/40 ring-2 ring-primary/25"
                          : "bg-background border-border/70 text-foreground hover:bg-muted",
                        status.count === 0 ? "opacity-60" : "",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                      <span
                        className={cn(
                          "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none",
                          isActive ? "bg-primary-foreground text-primary" : "bg-muted text-foreground",
                        )}
                      >
                        {status.count}
                      </span>
                      <span className="sr-only">{status.label}</span>
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium leading-none",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {status.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              applyChange({ q: query });
            }}
          >
            <label htmlFor="dashboard-search" className="sr-only">
              {labels.searchLabel}
            </label>
            <div className="relative flex-1">
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
                className="rounded-xl border border-border/80 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
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
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.viewMode}
            </p>
            <div className="inline-flex rounded-xl border border-border/80 bg-muted/30 p-1">
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
