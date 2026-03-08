import { CarSpecBento } from "@/components/car-spec-bento";
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
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-[1.4rem] font-semibold tracking-[-0.03em] text-foreground">
          {descriptionTitle}
        </h2>
        <p className="max-w-[74ch] whitespace-pre-wrap break-words text-[0.98rem] leading-8 text-foreground/88 [overflow-wrap:anywhere]">
          {description}
        </p>
      </section>

      {(hasCategoryDetails || !isCarCategory) && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {categoryDetailsTitle}
          </h3>
          {isCarCategory ? (
            <CarSpecBento locale={locale} valuesByKey={valuesByKey} />
          ) : categoryDetails.length > 0 ? (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {categoryDetails.map((detail) => (
                <div key={detail.id} className="min-w-[180px]">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {detail.label}
                  </p>
                  <p className="mt-0.5 break-words text-sm font-medium text-foreground/88 [overflow-wrap:anywhere]">
                    {detail.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{noCategoryDetailsLabel}</p>
          )}
        </section>
      )}
    </div>
  );
}
