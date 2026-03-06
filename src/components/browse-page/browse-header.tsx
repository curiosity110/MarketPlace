import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { SaveSearchPopout } from "@/components/save-search-popout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  smartBrowseLabel: string;
  totalCount: number;
  resultsLineLabel: string;
  listingsOnPageCount: number;
  onThisPageLabel: string;
  extraFiltersCount: number;
  extraFiltersLabel: string;
  hasAppliedFilters: boolean;
  showingAllLabel: string;
  canSaveSearch: boolean;
  locale: "en" | "mk";
  hasFilterChips: boolean;
  saveSearchQuery: Record<string, string>;
  resetHref: string;
  resetLabel: string;
};

export function BrowseHeader({
  title,
  smartBrowseLabel,
  totalCount,
  resultsLineLabel,
  listingsOnPageCount,
  onThisPageLabel,
  extraFiltersCount,
  extraFiltersLabel,
  hasAppliedFilters,
  showingAllLabel,
  canSaveSearch,
  locale,
  hasFilterChips,
  saveSearchQuery,
  resetHref,
  resetLabel,
}: Props) {
  return (
    <div className="flex max-w-full min-w-0 flex-wrap items-start justify-between gap-3 overflow-x-hidden">
      <div className="min-w-0 max-w-full space-y-1">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <SlidersHorizontal size={14} />
          {smartBrowseLabel}
        </p>
        <h1 className="break-words text-3xl font-bold [overflow-wrap:anywhere]">{title}</h1>
        <p className="flex max-w-full flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {totalCount} {resultsLineLabel} {listingsOnPageCount} {onThisPageLabel}
          {extraFiltersCount > 0 ? (
            <span className="ml-1 inline-flex items-center gap-1">
              |{" "}
              <Badge variant="secondary">
                {extraFiltersCount} {extraFiltersLabel}
              </Badge>
            </span>
          ) : null}
        </p>
        {!hasAppliedFilters ? (
          <p className="text-xs text-muted-foreground">{showingAllLabel}</p>
        ) : null}
      </div>
      <div className="flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2">
        {canSaveSearch && hasFilterChips ? (
          <SaveSearchPopout locale={locale} query={saveSearchQuery} />
        ) : null}
        {hasFilterChips ? (
          <Link href={resetHref} scroll={false} className="min-w-0 max-w-full">
            <Button variant="outline" type="button" className="max-w-full">
              {resetLabel}
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
