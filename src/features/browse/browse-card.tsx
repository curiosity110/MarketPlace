import Link from "next/link";
import { Pencil } from "lucide-react";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { MarkSoldPopout } from "@/components/mark-sold-popout";
import { ListingCardMedia } from "@/components/listing-card/shared";
import { Button } from "@/components/ui/button";
import { formatCurrencyFromCents } from "@/lib/currency";
import type { ListingCardDTO } from "@/lib/listing-card-select";
import { cn } from "@/lib/utils";

type BrowseCardProps = {
  listing: ListingCardDTO;
  locale?: "en" | "mk";
  currentAuthUserId?: string | null;
  isFavorited?: boolean;
  browseQuery?: string;
};

export function BrowseCard({
  listing,
  locale = "en",
  currentAuthUserId,
  isFavorited = false,
  browseQuery,
}: BrowseCardProps) {
  const isOwner = Boolean(currentAuthUserId && listing.ownerId === currentAuthUserId);
  const isSold = Boolean(listing.sale);
  const formattedPrice = formatCurrencyFromCents(listing.priceCents, listing.currency);
  const listingHref = browseQuery
    ? `/listing/${listing.id}?${browseQuery}`
    : `/listing/${listing.id}`;

  const text =
    locale === "mk"
      ? {
          noImage: "ÐÐµÐ¼Ð° ÑÐ»Ð¸ÐºÐ°",
          edit: "Ð£Ñ€ÐµÐ´Ð¸",
        }
      : {
          noImage: "No image",
          edit: "Edit",
        };

  return (
    <article className={cn("group relative min-w-0 overflow-hidden rounded-[1.35rem]")}>
      <Link
        href={listingHref}
        className="relative block aspect-[0.84] overflow-hidden rounded-[1.35rem] bg-muted"
      >
        <ListingCardMedia
          href={listingHref}
          title={listing.title}
          imageUrl={listing.images[0]?.url}
          emptyLabel={text.noImage}
          price={formattedPrice}
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
          topLeft={
            isOwner ? (
              <Link href={`/sell/${listing.id}/edit`} className="relative z-30">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 border-white/50 bg-black/20 p-0 backdrop-blur"
                  aria-label={text.edit}
                >
                  <Pencil size={12} />
                </Button>
              </Link>
            ) : null
          }
          topRight={
            isOwner ? null : (
              <FavoriteToggleButton
                listingId={listing.id}
                locale={locale}
                isAuthenticated={Boolean(currentAuthUserId)}
                initialFavorited={isFavorited}
                iconOnly
                className="h-8 w-8 border-white/50 bg-black/20 p-0 backdrop-blur"
              />
            )
          }
        />
      </Link>

      <div className="space-y-1.5 px-1 py-3">
        <div className="text-base font-semibold tracking-[-0.03em] text-primary">
          {formattedPrice}
        </div>
        <h3 className="line-clamp-2 text-sm font-medium tracking-tight text-foreground/88">
          <Link href={listingHref} className="hover:underline">
            {listing.title}
          </Link>
        </h3>
        <div className="text-xs text-muted-foreground">{listing.city.name}</div>
      </div>

      {isOwner && !isSold ? (
        <div className="mt-2">
          <MarkSoldPopout
            listingId={listing.id}
            locale={locale}
            defaultPriceCents={listing.priceCents}
          />
        </div>
      ) : null}
    </article>
  );
}
