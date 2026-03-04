import Image from "next/image";
import Link from "next/link";
import type {
  Currency,
  ListingCondition,
} from "@prisma/client";
import { ImageOff, MessageCircle, Pencil, Phone } from "lucide-react";
import { ContactSellerPopout } from "@/components/contact-seller-popout";
import { MarkSoldPopout } from "@/components/mark-sold-popout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyFromCents } from "@/lib/currency";
import { localizeCategoryPath } from "@/lib/category-label";

type ListingCardProps = {
  listing: {
    id: string;
    ownerId: string;
    title: string;
    description: string;
    priceCents: number;
    currency: Currency;
    condition: ListingCondition;
    createdAt: Date | string;
    seller?: {
      id?: string;
      name: string | null;
      email: string;
      phone?: string | null;
    };
    city: {
      id?: string;
      name: string;
    };
    category: {
      id: string;
      name: string;
      slug?: string | null;
      parent?: {
        id?: string;
        name: string;
        slug?: string | null;
      } | null;
    };
    images: { url: string }[];
    sale?: { id: string; soldAt: Date | string } | null;
  };
  locale?: "en" | "mk";
  currentAuthUserId?: string | null;
};

export function ListingCard({
  listing,
  locale = "en",
  currentAuthUserId,
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
      };
  const conditionLabelByValue: Record<ListingCondition, string> = isMk
    ? { NEW: "Ново", USED: "Користено", REFURBISHED: "Рефурбиширано" }
    : { NEW: "New", USED: "Used", REFURBISHED: "Refurbished" };
  const isOwner = Boolean(currentAuthUserId && listing.ownerId === currentAuthUserId);
  const isSold = Boolean(listing.sale);

  const firstImage = listing.images[0]?.url;
  const categoryLabel = localizeCategoryPath(listing.category, locale);
  const locationCategoryLine = categoryLabel
    ? `${listing.city.name} • ${categoryLabel}`
    : listing.city.name;
  const sellerLabel =
    listing.seller?.name || listing.seller?.email?.split("@")[0] || text.seller;
  const conditionLabel = conditionLabelByValue[listing.condition];
  const formattedPrice = formatCurrencyFromCents(listing.priceCents, listing.currency);
  const sellerPhone = listing.seller?.phone || null;

  return (
    <Card className="h-full overflow-hidden border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <div className="group relative aspect-video w-full overflow-hidden bg-muted">
        <Link href={`/listing/${listing.id}`} className="absolute inset-0 z-0">
          <span className="sr-only">{listing.title}</span>
        </Link>

        {firstImage ? (
          <Image
            src={firstImage}
            alt={listing.title}
            fill
            unoptimized
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
          <Badge variant="secondary" className="border-white/50 bg-background/90 shadow-sm">
            {conditionLabel}
          </Badge>
          {isSold && <Badge variant="secondary">{text.sold}</Badge>}
        </div>

        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          {isOwner && (
            <>
              <Link href={`/sell/${listing.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 border-white/70 bg-background/90 p-0 backdrop-blur"
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
        </div>

        <div className="absolute bottom-3 right-3 z-10 rounded-full border border-white/70 bg-white/95 px-3 py-1 text-sm font-bold text-primary shadow-sm dark:border-border dark:bg-background/95">
          {formattedPrice}
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <Link href={`/listing/${listing.id}`}>
          <h3 className="line-clamp-2 min-h-[2.7rem] text-base font-extrabold leading-tight tracking-tight transition-colors hover:text-primary">
            {listing.title}
          </h3>
        </Link>

        <p className="text-xs text-muted-foreground">{locationCategoryLine}</p>
        <p className="text-xs text-muted-foreground">
          {text.by} {sellerLabel}
        </p>

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
                <Button size="sm" variant="outline" className="h-9 w-9 p-0" aria-label={text.call}>
                  <Phone size={14} />
                </Button>
              </a>
            </div>
          ) : (
            <ContactSellerPopout listingId={listing.id} locale={locale} className="w-full justify-center" />
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
