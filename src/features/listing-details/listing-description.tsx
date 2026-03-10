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
  void locale;
  void categoryDetailsTitle;
  void noCategoryDetailsLabel;
  void categoryDetails;
  void valuesByKey;
  void isCarCategory;

  return (
    <section className="space-y-3 rounded-[1.35rem] bg-card/62 p-4 ring-1 ring-black/5 dark:ring-white/10 sm:p-5">
      <h2 className="text-[1.25rem] font-semibold tracking-[-0.03em] text-foreground">
        {descriptionTitle}
      </h2>
      <p className="max-w-[74ch] whitespace-pre-wrap break-words text-[0.96rem] leading-7 text-foreground/88 [overflow-wrap:anywhere]">
        {description}
      </p>
    </section>
  );
}
