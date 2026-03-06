import Link from "next/link";
import { SaveSearchPopout } from "@/components/save-search-popout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterToolbar, PageHeader } from "@/components/ui/layout";

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
  void smartBrowseLabel;
  void showingAllLabel;
  void hasAppliedFilters;
  return (
    <FilterToolbar
      leading={
        <PageHeader
          title={title}
          compact
          subtitle={
            <span className="flex max-w-full flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{totalCount}</span> {resultsLineLabel}{" "}
              {listingsOnPageCount} {onThisPageLabel}
              {extraFiltersCount > 0 ? (
                <span className="ml-1 inline-flex items-center gap-1">
                  <Badge variant="default" className="h-5 px-1.5 text-[0.65rem]">
                    {extraFiltersCount} {extraFiltersLabel}
                  </Badge>
                </span>
              ) : null}
            </span>
          }
        />
      }
      trailing={
        <>
          {canSaveSearch && hasFilterChips ? (
            <SaveSearchPopout locale={locale} query={saveSearchQuery} />
          ) : null}
          {hasFilterChips ? (
            <Link href={resetHref} scroll={false} className="min-w-0 max-w-full">
              <Button variant="ghost" type="button" className="max-w-full">
                {resetLabel}
              </Button>
            </Link>
          ) : null}
        </>
      }
    />
  );
}
