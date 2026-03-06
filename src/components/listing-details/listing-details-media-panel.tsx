import { ListingGallery } from "@/components/listing-gallery";

type Props = {
  locale: "en" | "mk";
  imageUrls: string[];
};

export function ListingDetailsMediaPanel({ locale, imageUrls }: Props) {
  return (
    <div className="max-w-full overflow-hidden">
      <ListingGallery images={imageUrls} locale={locale} />
    </div>
  );
}
