import Image from "next/image";
import Link from "next/link";
import type { ListingCondition } from "@prisma/client";
import { ImageOff, MessageCircle, Pencil, Phone } from "lucide-react";
import { ContactSellerPopout } from "@/components/contact-seller-popout";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { MarkSoldPopout } from "@/components/mark-sold-popout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        whatsapp: "WhatsApp",
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
  const conditionLabelByValue: Record<ListingCondition, string> = isMk
    ? { NEW: "Ново", USED: "Користено", REFURBISHED: "Рефурбиширано" }
    : { NEW: "New", USED: "Used", REFURBISHED: "Refurbished" };
  const isOwner = Boolean(
    currentAuthUserId && listing.ownerId === currentAuthUserId,
  );
  const isSold = Boolean(listing.sale);

  const firstImage = listing.images[0]?.url;
  const categoryLabel = localizeCategoryPath(listing.category, locale);
  const locationCategoryLine = categoryLabel
    ? `${listing.city.name} • ${categoryLabel}`
    : listing.city.name;
  const sellerLabel = listing.seller?.name || text.seller;
  const conditionLabel = conditionLabelByValue[listing.condition];
  const formattedPrice = formatCurrencyFromCents(listing.priceCents, listing.currency);
  const sellerPhone = listing.seller?.phone || null;

  const moreLikeHref = browseQuery && similarityData
    ? patchBrowseParams(browseQuery, {
        clear: BROWSE_SIMILARITY_CLEAR_KEYS,
        set: buildSimilarityParams(similarityData),
      })
    : null;

  const exclusionParams = similarityData
    ? buildExclusionParams(similarityData)
    : {};
  const excludeLikeHref =
    browseQuery && Object.keys(exclusionParams).length > 0
      ? patchBrowseParams(browseQuery, {
          set: exclusionParams,
        })
      : null;
  const listingHref = browseQuery ? `/listing/${listing.id}?${browseQuery}` : `/listing/${listing.id}`;

  return (
    <Card className="h-full min-w-0 overflow-hidden bg-card transition-all duration-200 hover:-translate-y-0.5 hover:ring-black/10 hover:shadow-[0_18px_38px_-30px_rgba(15,23,42,0.35)] dark:hover:ring-white/10">
      <div className="group relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Link href={listingHref} className="absolute inset-0 z-0">
          <span className="sr-only">{listing.title}</span>
        </Link>

        {firstImage ? (
          <Image
            src={firstImage}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-muted-foreground dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/85 ring-1 ring-black/10 dark:ring-white/10">
              <ImageOff size={18} />
            </span>
            <span className="text-xs font-medium">{text.noImage}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />

        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          <Badge
            variant={isSold ? "default" : "secondary"}
            className="h-5.5 border-white/40 bg-background/90 px-2"
          >
            {isSold ? text.sold : conditionLabel}
          </Badge>
        </div>

        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          {isOwner && (
            <>
              <Link href={`/sell/${listing.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 border-white/50 bg-background/90 p-0 backdrop-blur"
                  aria-label={text.edit}
                >
                  <Pencil size={13} />
                </Button>
              </Link>
              {!isSold && (
                <MarkSoldPopout
                  listingId={listing.id}
                  locale={locale}
                  defaultPriceCents={listing.priceCents}
                  iconOnly
                  className="border-white/50 bg-background/90 backdrop-blur"
                />
              )}
            </>
          )}
          {!isOwner && (
            <FavoriteToggleButton
              listingId={listing.id}
              locale={locale}
              isAuthenticated={Boolean(currentAuthUserId)}
              initialFavorited={isFavorited}
              iconOnly
              className="h-7 w-7 border-white/50 bg-background/90 p-0 backdrop-blur"
            />
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 p-3 text-white">
          <p className="line-clamp-2 max-w-[85%] text-base font-semibold leading-tight tracking-tight sm:text-[1.02rem]">
            {listing.title}
          </p>
        </div>
      </div>

      <CardContent className="space-y-3 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-lg font-semibold leading-none tracking-tight text-primary sm:text-xl">
              {formattedPrice}
            </p>
            <p className="truncate text-xs text-muted-foreground">{locationCategoryLine}</p>
            <p className="truncate text-xs text-muted-foreground">
              {text.by} {sellerLabel}
            </p>
          </div>
        </div>

        {moreLikeHref && (
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
        )}

        {!isOwner && !isSold ? (
          sellerPhone ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <a href={`tel:${sellerPhone}`} className="min-w-0">
                <Button size="sm" className="w-full gap-2">
                  <MessageCircle size={14} />
                  <span className="truncate">{text.contactSeller}</span>
                </Button>
              </a>
              <a href={`tel:${sellerPhone}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-9 p-0"
                  aria-label={text.call}
                >
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

        <p className="border-t border-border/40 pt-2 text-[0.72rem] text-muted-foreground">
          {text.listed}{" "}
          {new Date(listing.createdAt).toLocaleDateString(isMk ? "mk-MK" : "en-US")}
        </p>
      </CardContent>
    </Card>
  );
}
