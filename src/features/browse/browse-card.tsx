import Link from "next/link";
import { Pencil } from "lucide-react";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { MarkSoldPopout } from "@/components/mark-sold-popout";
import {
  formatListingCardDate,
  getListingConditionLabel,
  ListingCardMedia,
  ListingCardMeta,
} from "@/components/listing-card/shared";
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
  const conditionLabel = getListingConditionLabel(listing.condition, locale);
  const listedDate = formatListingCardDate(listing.createdAt, locale);
  const listingHref = browseQuery
    ? `/listing/${listing.id}?${browseQuery}`
    : `/listing/${listing.id}`;

  const text =
    locale === "mk"
      ? {
          noImage: "Нема слика",
          edit: "Уреди",
        }
      : {
          noImage: "No image",
          edit: "Edit",
        };

  return (
    <article
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-[1.1rem] bg-card shadow-[0_18px_34px_-34px_rgba(15,23,42,0.28)] ring-1 ring-black/6 dark:ring-white/10",
      )}
    >
      <div className="overflow-hidden rounded-[1.1rem]">
        <ListingCardMedia
          href={listingHref}
          title={listing.title}
          imageUrl={listing.images[0]?.url}
          emptyLabel={text.noImage}
          showPrice={false}
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
          topLeft={
            isOwner ? (
              <Link href={`/sell/${listing.id}/edit`} className="relative z-30">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 border-white/65 bg-background/78 p-0 text-foreground shadow-sm backdrop-blur"
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
                className="h-8 w-8 border-white/65 bg-background/78 p-0 text-foreground shadow-sm backdrop-blur"
              />
            )
          }
          imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <Link href={listingHref} className="block space-y-1 px-3 py-2">
        <p className="text-[15px] font-semibold leading-none tracking-[-0.03em] text-foreground">
          {formattedPrice}
        </p>
        <h3 className="line-clamp-2 text-[13px] font-medium leading-[1.2rem] tracking-[-0.01em] text-foreground/88">
          <span className="hover:underline">{listing.title}</span>
        </h3>
        <ListingCardMeta
          items={[listing.city.name, conditionLabel]}
          className="text-[11px] text-muted-foreground/82"
        />
        <p className="pt-0.5 text-[10px] text-muted-foreground/68">{listedDate}</p>
      </Link>

      {isOwner && !isSold ? (
        <div className="px-3 pb-2.5 pt-0">
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
