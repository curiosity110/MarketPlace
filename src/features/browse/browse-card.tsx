import Link from "next/link";
import { Pencil, UserRound } from "lucide-react";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { MarkSoldPopout } from "@/components/mark-sold-popout";
import {
  formatListingCardDate,
  getListingConditionLabel,
  ListingCardMedia,
  ListingCardMeta,
  ListingCardTag,
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
  const categoryLabel = listing.category?.parent?.name ?? listing.category?.name ?? "";
  const displaySellerName =
    listing.seller?.name || listing.seller?.username || null;

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
        "group relative min-w-0 overflow-hidden rounded-xl bg-card shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.06] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.25)] hover:ring-black/[0.08] dark:ring-white/10",
      )}
    >
      <div className="overflow-hidden rounded-t-xl">
        <ListingCardMedia
          href={listingHref}
          title={listing.title}
          imageUrl={listing.images[0]?.url}
          emptyLabel={text.noImage}
          showPrice={false}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
          roundedTopOnly
          topLeft={
            <ListingCardTag
              variant={isSold ? "default" : "secondary"}
              className="bg-black/50 text-white border-0 backdrop-blur-sm text-[10px] px-2 py-0.5"
            >
              {isSold ? "Sold" : conditionLabel}
            </ListingCardTag>
          }
          topRight={
            !isOwner ? (
              <FavoriteToggleButton
                listingId={listing.id}
                locale={locale}
                isAuthenticated={Boolean(currentAuthUserId)}
                initialFavorited={isFavorited}
                iconOnly
                className="h-8 w-8 rounded-full border-0 bg-white/90 backdrop-blur-sm p-0 text-foreground/90 shadow-sm hover:bg-white"
              />
            ) : null
          }
        />
      </div>

      <div className="space-y-1.5 px-3 py-2.5">
        <Link href={listingHref} className="block">
          <h3 className="truncate text-[13px] font-bold leading-tight tracking-[-0.02em] text-foreground hover:underline">
            {listing.title}
          </h3>
        </Link>
        <p className="text-base font-bold leading-none tracking-tight text-orange-500">
          {formattedPrice}
        </p>
        <ListingCardMeta
          items={[listing.city.name, categoryLabel].filter(Boolean)}
          className="text-[11px] text-muted-foreground/80 truncate"
        />
        <p className="text-[10px] text-muted-foreground/60">{listedDate}</p>
        {displaySellerName && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground">
              <UserRound size={10} />
            </span>
            <span className="truncate text-[11px] text-muted-foreground/90">
              {displaySellerName}
            </span>
          </div>
        )}
      </div>

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
