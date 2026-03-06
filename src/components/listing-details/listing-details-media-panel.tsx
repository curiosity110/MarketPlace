import { ListingGallery } from "@/components/listing-gallery";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  locale: "en" | "mk";
  imageUrls: string[];
};

export function ListingDetailsMediaPanel({ locale, imageUrls }: Props) {
  return (
    <Card className="max-w-full overflow-hidden border-border/60 bg-card/90 shadow-sm">
      <CardContent className="min-w-0 max-w-full space-y-4 p-3 sm:p-4">
        <ListingGallery images={imageUrls} locale={locale} />
      </CardContent>
    </Card>
  );
}
