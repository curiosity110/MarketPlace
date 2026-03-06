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
    <section className="space-y-3">
      <div className="flex max-w-full min-w-0 items-start justify-between gap-3">
        <h2 className="min-w-0 break-words text-base font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-lg">
          {categoryDetailsLabel}
        </h2>
      </div>

      {isCarCategory ? (
        <CarSpecBento locale={locale} valuesByKey={valuesByKey} />
      ) : categoryDetails.length > 0 ? (
        <div className="grid max-w-full min-w-0 gap-2 sm:grid-cols-2">
          {categoryDetails.map((detail) => (
            <div
              key={detail.id}
              className="rounded-xl bg-muted/28 p-3 ring-1 ring-black/5 dark:ring-white/10"
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
    </section>
  );
}
