import Link from "next/link";
import { MapPin, MessageCircle, Phone, UserRound } from "lucide-react";
import { ContactSellerPopout } from "@/components/contact-seller-popout";
import { Button } from "@/components/ui/button";
import type { ListingDetailsSellerCardProps } from "@/features/listing-details/types";

export function ListingContact({
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
  const primaryAction =
    !isOwner && !isSold ? (
      sellerPhone ? (
        <a href={`tel:${sellerPhone}`} className="block">
          <Button size="lg" className="h-12 w-full justify-center gap-2 rounded-full">
            <Phone size={16} />
            {text.contactSeller}
          </Button>
        </a>
      ) : (
        <ContactSellerPopout
          listingId={listingId}
          locale={locale}
          className="h-12 w-full justify-center rounded-full"
        />
      )
    ) : null;

  return (
    <section className="rounded-[1.35rem] bg-card/72 p-4 ring-1 ring-black/5 dark:ring-white/10 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted/60 text-foreground">
          <UserRound size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {text.seller}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">{sellerNameOrEmail}</p>
          {cityName ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} />
              {cityName}
            </p>
          ) : null}
        </div>
      </div>

      {primaryAction ? <div className="mt-4 hidden sm:block">{primaryAction}</div> : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
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
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageCircle size={13} />
            {text.whatsapp}
          </a>
        ) : null}
      </div>
    </section>
  );
}
