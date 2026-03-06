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

  return (
    <div className="max-w-full overflow-x-hidden rounded-xl border border-primary/25 bg-primary/5 p-3">
      <div className="mb-2 flex max-w-full min-w-0 flex-wrap items-center justify-between gap-2">
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
      <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {similarityFiltersLabel}
        </span>
        {chips.map((chip) => (
          <Link
            key={chip.key}
            href={chip.href}
            scroll={false}
            className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/35 hover:text-primary"
            aria-label={`${removeFilterLabel}: ${chip.label}`}
          >
            <span className="block max-w-[min(62vw,18rem)] truncate sm:max-w-[22rem]">
              {chip.label}
            </span>
            <span aria-hidden>×</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
