import { CarSpecBento } from "@/components/car-spec-bento";
import type { ListingDescriptionProps } from "@/features/listing-details/types";

function hasUsefulCarSpecs(valuesByKey: Record<string, string>) {
  const knownKeys = [
    "make",
    "brand",
    "car_make",
    "model",
    "car_model",
    "year",
    "car_year",
    "kilometers",
    "km",
    "mileage",
    "fuel",
    "fuel_type",
    "transmission",
    "gearbox",
    "body",
    "body_type",
    "engine",
    "engine_cc",
    "displacement",
    "power",
    "hp",
    "kw",
    "drive",
    "drivetrain",
    "doors",
    "seats",
  ];

  return knownKeys.filter((key) => (valuesByKey[key] || "").trim().length > 0).length >= 2;
}

export function ListingExtraDetails({
  locale,
  categoryDetailsTitle,
  categoryDetails,
  valuesByKey,
  isCarCategory,
}: Pick<
  ListingDescriptionProps,
  "locale" | "categoryDetailsTitle" | "categoryDetails" | "valuesByKey" | "isCarCategory"
>) {
  const shouldShowCars = isCarCategory && hasUsefulCarSpecs(valuesByKey);
  const shouldShowGeneric = !isCarCategory && categoryDetails.length >= 2;

  if (!shouldShowCars && !shouldShowGeneric) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-[1.35rem] bg-card/62 p-4 ring-1 ring-black/5 dark:ring-white/10 sm:p-5">
      <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {categoryDetailsTitle}
      </h2>

      {shouldShowCars ? (
        <CarSpecBento locale={locale} valuesByKey={valuesByKey} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryDetails.map((detail) => (
            <div
              key={detail.id}
              className="rounded-[1rem] bg-muted/26 p-3 ring-1 ring-black/5 dark:ring-white/10"
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {detail.label}
              </p>
              <p className="mt-1 break-words text-sm font-medium text-foreground/90 [overflow-wrap:anywhere]">
                {detail.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
