import { CarSpecBento } from "@/components/car-spec-bento";
import { SectionBlock } from "@/components/ui/layout";
import type { ListingDescriptionProps } from "@/features/listing-details/types";

export function ListingDescription({
  locale,
  descriptionTitle,
  description,
  categoryDetailsTitle,
  noCategoryDetailsLabel,
  categoryDetails,
  valuesByKey,
  isCarCategory,
}: ListingDescriptionProps) {
  void noCategoryDetailsLabel;
  const hasCategoryDetails = isCarCategory || categoryDetails.length > 0;

  return (
    <div className="space-y-4">
      <SectionBlock title={descriptionTitle}>
        <p className="max-w-[74ch] whitespace-pre-wrap break-words text-sm leading-7 text-foreground/88 [overflow-wrap:anywhere] sm:text-[0.98rem]">
          {description}
        </p>
      </SectionBlock>

      {(hasCategoryDetails || !isCarCategory) && (
        <SectionBlock title={categoryDetailsTitle}>
          {isCarCategory ? (
            <CarSpecBento locale={locale} valuesByKey={valuesByKey} />
          ) : categoryDetails.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {categoryDetails.map((detail) => (
                <div
                  key={detail.id}
                  className="rounded-[1rem] bg-muted/28 px-3 py-3 ring-1 ring-black/5 dark:ring-white/10"
                >
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {detail.label}
                  </p>
                  <p className="mt-1 break-words text-sm font-medium [overflow-wrap:anywhere]">
                    {detail.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </SectionBlock>
      )}
    </div>
  );
}
