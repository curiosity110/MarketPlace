import { CarSpecBento } from "@/components/car-spec-bento";
import type { ListingCategoryDetail } from "@/components/listing-details/listing-details.utils";

type Props = {
  locale: "en" | "mk";
  categoryDetailsLabel: string;
  noCategoryDetailsLabel: string;
  categoryDetails: ListingCategoryDetail[];
  valuesByKey: Record<string, string>;
  isCarCategory: boolean;
};

export function ListingDetailsExtraSection({
  locale,
  categoryDetailsLabel,
  noCategoryDetailsLabel,
  categoryDetails,
  valuesByKey,
  isCarCategory,
}: Props) {
  return (
    <>
      <div className="flex max-w-full min-w-0 items-start justify-between gap-3">
        <h2 className="min-w-0 break-words text-base font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-lg">
          {categoryDetailsLabel}
        </h2>
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          {categoryDetails.length}
        </span>
      </div>

      {isCarCategory ? (
        <CarSpecBento locale={locale} valuesByKey={valuesByKey} />
      ) : categoryDetails.length > 0 ? (
        <div className="grid max-w-full min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {categoryDetails.map((detail) => (
            <div
              key={detail.id}
              className="rounded-lg bg-muted/15 p-3 ring-1 ring-border/55"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {detail.label}
              </p>
              <p className="max-w-full break-words text-sm font-semibold [overflow-wrap:anywhere]">
                {detail.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="max-w-full break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {noCategoryDetailsLabel}
        </p>
      )}
    </>
  );
}
