import Link from "next/link";
import { Button } from "@/components/ui/button";

type BrowseEmptyStateProps = {
  hasAppliedFilters: boolean;
  noMatchLabel: string;
  noListingsYetLabel: string;
  createHref: string;
  firstListLabel: string;
};

export function BrowseEmptyState({
  hasAppliedFilters,
  noMatchLabel,
  noListingsYetLabel,
  createHref,
  firstListLabel,
}: BrowseEmptyStateProps) {
  return (
    <div className="market-surface flex flex-col items-center justify-center gap-4 rounded-[1.8rem] px-6 py-16 text-center ring-1 ring-black/4">
      <div className="space-y-2">
        <p className="text-lg font-medium text-foreground">
          {hasAppliedFilters ? noMatchLabel : noListingsYetLabel}
        </p>
      </div>

      {!hasAppliedFilters && (
        <Link href={createHref}>
          <Button size="sm">{firstListLabel}</Button>
        </Link>
      )}
    </div>
  );
}
