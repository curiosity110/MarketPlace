import Link from "next/link";
import { Button } from "@/components/ui/button";

type SuggestedCategory = { id: string; name: string };

type BrowseEmptyStateProps = {
  hasAppliedFilters: boolean;
  noMatchLabel: string;
  noListingsYetLabel: string;
  createHref: string;
  firstListLabel: string;
  suggestedCategories?: SuggestedCategory[];
  tryCategoriesLabel?: string;
};

export function BrowseEmptyState({
  hasAppliedFilters,
  noMatchLabel,
  noListingsYetLabel,
  createHref,
  firstListLabel,
  suggestedCategories = [],
  tryCategoriesLabel = "Try",
}: BrowseEmptyStateProps) {
  const showSuggestions = hasAppliedFilters && suggestedCategories.length > 0;

  return (
    <div className="market-surface flex flex-col items-center justify-center gap-5 rounded-[1.8rem] px-6 py-16 text-center ring-1 ring-black/4">
      <div className="space-y-2">
        <p className="text-lg font-medium text-foreground">
          {hasAppliedFilters ? noMatchLabel : noListingsYetLabel}
        </p>
      </div>

      {showSuggestions && (
        <div className="flex flex-wrap justify-center gap-2">
          <span className="w-full text-sm text-muted-foreground">{tryCategoriesLabel}:</span>
          {suggestedCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/browse?cat=${cat.id}`}
              className="rounded-full bg-muted/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {!hasAppliedFilters && (
        <Link href={createHref}>
          <Button size="sm">{firstListLabel}</Button>
        </Link>
      )}
    </div>
  );
}
