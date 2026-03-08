import Link from "next/link";
import { MapPin, MessageCircle, Phone, UserRound } from "lucide-react";
import { ContactSellerPopout } from "@/components/contact-seller-popout";
import { Button } from "@/components/ui/button";
import type { ListingDetailsSellerCardProps } from "@/features/listing-details/types";

export function ListingSellerStrip({
  locale,
  listingId,
  sellerId,
  sellerNameOrEmail,
  sellerPhone,
  isOwner,
  isSold,
  browseQuery,
  whatsappHref,
  cityName,
  text,
}: ListingDetailsSellerCardProps) {
  void whatsappHref;

  const primaryAction =
    !isOwner && !isSold ? (
      sellerPhone ? (
        <a href={`tel:${sellerPhone}`} className="block">
          <Button size="lg" className="h-12 w-full gap-2">
            <MessageCircle size={16} />
            {text.contactSeller}
          </Button>
        </a>
      ) : (
        <ContactSellerPopout
          listingId={listingId}
          locale={locale}
          className="h-12 w-full justify-center"
        />
      )
    ) : null;

  return (
    <div className="space-y-4 rounded-[1.6rem] bg-card/68 p-4 ring-1 ring-black/4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/60 text-foreground">
          <UserRound size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {text.seller}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {sellerNameOrEmail}
          </p>
          {cityName ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} />
              {cityName}
            </p>
          ) : null}
        </div>
      </div>

      {primaryAction}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href={`/seller/${sellerId}${browseQuery ? `?${browseQuery}` : ""}`}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {text.viewProfile}
        </Link>
        {sellerPhone ? (
          <a
            href={`tel:${sellerPhone}`}
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Phone size={13} />
            {text.call}
          </a>
        ) : null}
        {!isOwner ? (
          <span className="text-xs text-muted-foreground">{text.report}</span>
        ) : null}
      </div>
    </div>
  );
}
