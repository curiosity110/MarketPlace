import Link from "next/link";
import { Pencil, Phone } from "lucide-react";
import { ContactSellerPopout } from "@/components/contact-seller-popout";
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
import { ListingCardBase } from "@/components/ui/layout";
import {
  BROWSE_SIMILARITY_CLEAR_KEYS,
  patchBrowseParams,
} from "@/lib/browse/params";
import {
  buildExclusionParams,
  buildSimilarityParams,
} from "@/lib/browse/similarity";
import { localizeCategoryPath } from "@/lib/category-label";
import { formatCurrencyFromCents } from "@/lib/currency";
import type { ListingCardDTO } from "@/lib/listing-card-select";

type SimilarityData = {
  id: string;
  city: { id: string };
  carMake: { slug: string } | null;
  carModel: { slug: string } | null;
  carYear: number | null;
  priceCents: number;
  fieldValues: { key: string; value: string }[];
};

type ListingCardProps = {
  listing: ListingCardDTO;
  locale?: "en" | "mk";
  currentAuthUserId?: string | null;
  isFavorited?: boolean;
  browseQuery?: string;
  similarityData?: SimilarityData;
};

export function ListingCard({
  listing,
  locale = "en",
  currentAuthUserId,
  isFavorited = false,
  browseQuery,
  similarityData,
}: ListingCardProps) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        noImage: "Нема слика",
        seller: "Продавач",
        by: "Од",
        listed: "Објавено",
        contactSeller: "Контактирај",
        call: "Јави се",
        edit: "Уреди",
        sold: "Продадено",
        moreLikeThis: "Слични",
        excludeLikeThis: "Исклучи слични",
      }
    : {
        noImage: "No image",
        seller: "Seller",
        by: "By",
        listed: "Listed",
        contactSeller: "Contact seller",
        call: "Call",
        edit: "Edit",
        sold: "Sold",
        moreLikeThis: "More like this",
        excludeLikeThis: "Exclude like this",
      };

  const isOwner = Boolean(currentAuthUserId && listing.ownerId === currentAuthUserId);
  const isSold = Boolean(listing.sale);
  const firstImage = listing.images[0]?.url;
  const categoryLabel = localizeCategoryPath(listing.category, locale);
  const sellerLabel = listing.seller?.name || text.seller;
  const conditionLabel = getListingConditionLabel(listing.condition, locale);
  const formattedPrice = formatCurrencyFromCents(listing.priceCents, listing.currency);
  const sellerPhone = listing.seller?.phone || null;
  const listingHref = browseQuery ? `/listing/${listing.id}?${browseQuery}` : `/listing/${listing.id}`;
  const locationCategoryLine = categoryLabel ? `${listing.city.name} • ${categoryLabel}` : listing.city.name;

  const moreLikeHref = browseQuery && similarityData
    ? patchBrowseParams(browseQuery, {
        clear: BROWSE_SIMILARITY_CLEAR_KEYS,
        set: buildSimilarityParams(similarityData),
      })
    : null;

  const exclusionParams = similarityData ? buildExclusionParams(similarityData) : {};
  const excludeLikeHref =
    browseQuery && Object.keys(exclusionParams).length > 0
      ? patchBrowseParams(browseQuery, {
          set: exclusionParams,
        })
      : null;

  return (
    <ListingCardBase
      media={
        <ListingCardMedia
          href={listingHref}
          title={listing.title}
          imageUrl={firstImage}
          emptyLabel={text.noImage}
          price={formattedPrice}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          topLeft={
            <ListingCardTag variant={isSold ? "default" : "secondary"}>
              {isSold ? text.sold : conditionLabel}
            </ListingCardTag>
          }
          topRight={
            isOwner ? (
              <>
                <Link href={`/sell/${listing.id}/edit`} className="relative z-30">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 border-white/50 bg-background/92 p-0 backdrop-blur"
                    aria-label={text.edit}
                  >
                    <Pencil size={14} />
                  </Button>
                </Link>
                {!isSold ? (
                  <MarkSoldPopout
                    listingId={listing.id}
                    locale={locale}
                    defaultPriceCents={listing.priceCents}
                    iconOnly
                    className="h-9 w-9 border-white/50 bg-background/92 p-0 backdrop-blur"
                  />
                ) : null}
              </>
            ) : (
              <FavoriteToggleButton
                listingId={listing.id}
                locale={locale}
                isAuthenticated={Boolean(currentAuthUserId)}
                initialFavorited={isFavorited}
                iconOnly
                className="h-9 w-9 border-white/50 bg-background/92 p-0 backdrop-blur"
              />
            )
          }
        />
      }
      body={
        <>
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-[1.02rem] font-semibold leading-tight tracking-tight">
              <Link href={listingHref} className="hover:underline">
                {listing.title}
              </Link>
            </h3>
            <ListingCardMeta items={[locationCategoryLine, `${text.by} ${sellerLabel}`]} />
          </div>

          {moreLikeHref ? (
            <div className="grid grid-cols-2 gap-2">
              <Link href={moreLikeHref} className="min-w-0" scroll={false}>
                <Button size="sm" variant="outline" className="w-full">
                  <span className="truncate">{text.moreLikeThis}</span>
                </Button>
              </Link>
              {excludeLikeHref ? (
                <Link href={excludeLikeHref} className="min-w-0" scroll={false}>
                  <Button size="sm" variant="outline" className="w-full">
                    <span className="truncate">{text.excludeLikeThis}</span>
                  </Button>
                </Link>
              ) : (
                <div />
              )}
            </div>
          ) : null}

          {!isOwner && !isSold ? (
            sellerPhone ? (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <a href={`tel:${sellerPhone}`} className="min-w-0">
                  <Button size="sm" className="w-full gap-2">
                    <Phone size={14} />
                    <span className="truncate">{text.contactSeller}</span>
                  </Button>
                </a>
                <a href={`tel:${sellerPhone}`}>
                  <Button size="sm" variant="outline" className="h-9 w-9 p-0" aria-label={text.call}>
                    <Phone size={14} />
                  </Button>
                </a>
              </div>
            ) : (
              <ContactSellerPopout
                listingId={listing.id}
                locale={locale}
                className="w-full justify-center"
              />
            )
          ) : null}
        </>
      }
      footer={
        <>
          {text.listed} {formatListingCardDate(listing.createdAt, locale)}
        </>
      }
    />
  );
}
