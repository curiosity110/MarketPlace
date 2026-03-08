import { Camera } from "lucide-react";
import { ListingGallery } from "@/components/listing-gallery";
import type { ListingDetailsLocale, ListingDetailsText } from "@/features/listing-details/types";

type Props = {
  locale: ListingDetailsLocale;
  imageUrls: string[];
  title: string;
  text: ListingDetailsText;
};

export function ListingMedia({ locale, imageUrls, title, text }: Props) {
  void title;

  if (imageUrls.length === 0) {
    return (
      <section className="overflow-hidden rounded-[1.9rem] bg-gradient-to-br from-stone-100 via-stone-50 to-stone-200 ring-1 ring-black/4 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 dark:ring-white/10">
        <div className="flex aspect-[4/5] min-h-[340px] items-center justify-center p-6 lg:aspect-[4/5]">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <Camera size={24} />
            </div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {text.mediaEmptyTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{text.mediaEmptyHint}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0">
      <ListingGallery images={imageUrls} locale={locale} />
    </section>
  );
}
