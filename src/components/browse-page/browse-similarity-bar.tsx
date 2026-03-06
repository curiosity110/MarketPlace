import Link from "next/link";
import type { ActiveFilterChip } from "@/app/browse/browse-page.types";

type Props = {
  show: boolean;
  becauseClickedLabel: string;
  selectedListingLabel: string;
  clearSimilarityHref: string;
  clearSimilarityLabel: string;
  similarityFiltersLabel: string;
  chips: ActiveFilterChip[];
  removeFilterLabel: string;
};

export function BrowseSimilarityBar({
  show,
  becauseClickedLabel,
  selectedListingLabel,
  clearSimilarityHref,
  clearSimilarityLabel,
  similarityFiltersLabel,
  chips,
  removeFilterLabel,
}: Props) {
  if (!show) return null;
  void similarityFiltersLabel;
  void chips;
  void removeFilterLabel;

  return (
    <div className="max-w-full overflow-x-hidden rounded-xl bg-primary/5 p-3 ring-1 ring-primary/12">
      <div className="flex max-w-full min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
          {becauseClickedLabel}{" "}
          <span className="inline-block max-w-full align-bottom text-primary">
            {selectedListingLabel}
          </span>
        </p>
        <Link
          href={clearSimilarityHref}
          scroll={false}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {clearSimilarityLabel}
        </Link>
      </div>
    </div>
  );
}
