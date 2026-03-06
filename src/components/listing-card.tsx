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
    <Card className="h-full min-w-0 overflow-hidden rounded-2xl border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <div className="group relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-video">
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
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/60 text-muted-foreground dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80">
              <ImageOff size={16} />
            </span>
            <span className="text-xs font-medium">{text.noImage}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          <Badge
            variant="secondary"
            className="h-7 border-white/50 bg-background/90 px-2.5 text-xs shadow-sm"
          >
            {conditionLabel}
          </Badge>
          {isSold && (
            <Badge variant="secondary" className="h-7 px-2.5 text-xs">
              {text.sold}
            </Badge>
          )}
        </div>

        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          {isOwner && (
            <>
              <Link href={`/sell/${listing.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 border-white/70 bg-background/90 p-0 backdrop-blur"
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
                  className="border-white/70 bg-background/90 backdrop-blur"
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
              className="h-7 w-7 border-white/70 bg-background/90 p-0 backdrop-blur"
            />
          )}
        </div>

        <div className="absolute bottom-3 right-3 z-10 rounded-full border border-white/70 bg-white/95 px-3 py-1 text-base font-black text-primary shadow-sm dark:border-border dark:bg-background/95">
          {formattedPrice}
        </div>
      </div>

      <CardContent className="space-y-2.5 p-3.5 sm:p-4">
        <Link href={listingHref}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-lg font-extrabold leading-tight tracking-tight transition-colors hover:text-primary sm:text-base">
            {listing.title}
          </h3>
        </Link>

        <p className="truncate text-xs text-muted-foreground">{locationCategoryLine}</p>
        <p className="truncate text-xs text-muted-foreground">
          {text.by} {sellerLabel}
        </p>

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

        <p className="border-t border-border/60 pt-2 text-xs text-muted-foreground">
          {text.listed}{" "}
          {new Date(listing.createdAt).toLocaleDateString(isMk ? "mk-MK" : "en-US")}
        </p>
      </CardContent>
    </Card>
  );
}
