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
  if (imageUrls.length === 0) {
    return (
      <section className="overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-stone-100 via-stone-50 to-stone-200 ring-1 ring-black/5 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 dark:ring-white/10">
        <div className="flex aspect-[4/3] min-h-[240px] items-center justify-center p-6 sm:min-h-[320px]">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <Camera size={24} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
              {text.mediaEmptyTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{text.mediaEmptyHint}</p>
            <p className="mt-3 text-xs text-muted-foreground/80">{title}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.45rem] bg-card/62 ring-1 ring-black/5 dark:ring-white/10">
      <ListingGallery images={imageUrls} locale={locale} />
    </section>
  );
}
