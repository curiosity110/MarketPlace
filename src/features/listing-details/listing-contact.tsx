"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactSellerPopout } from "@/components/contact-seller-popout";

type Props = {
  locale: "en" | "mk";
  listingId: string;
  sellerName: string;
  sellerPhone: string | null;
  sellerEmail: string;
  sellerId: string;
  isSold: boolean;
  isAuthenticated: boolean;
  browseQuery: string;
  whatsappHref: string;
  text: any;
};

export function ListingContact({
  locale,
  listingId,
  sellerName,
  sellerPhone,
  sellerEmail,
  sellerId,
  isSold,
  isAuthenticated,
  browseQuery,
  whatsappHref,
  text,
}: Props) {
  if (isSold) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        <p>{text.itemSold}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[1.4rem] bg-card/65 p-4 ring-1 ring-border/45 sm:p-5">
      {/* Seller Info */}
      <div>
        <p className="text-sm font-medium text-foreground">{text.seller}</p>
        <p className="text-base font-semibold text-foreground [overflow-wrap:anywhere]">{sellerName}</p>
      </div>

      {/* Contact Methods - vertical stack on mobile, horizontal on desktop */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
        {/* Primary CTA: Contact Seller */}
        {sellerPhone ? (
          <a href={`tel:${sellerPhone}`} className="sm:col-span-2">
            <Button size="lg" className="h-12 w-full gap-2">
              <Phone size={16} />
              <span>{text.contactSeller}</span>
            </Button>
          </a>
        ) : (
          <div className="sm:col-span-2">
            <ContactSellerPopout
              listingId={listingId}
              locale={locale}
              className="h-12 w-full justify-center"
            />
          </div>
        )}

        {/* Secondary: WhatsApp if available */}
        {sellerPhone && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="h-12 w-full">
              WhatsApp
            </Button>
          </a>
        )}

        {/* View Profile */}
        <Link href={`/seller/${sellerId}${browseQuery ? `?${browseQuery}` : ""}`}>
          <Button variant="outline" size="lg" className="h-12 w-full">
            {text.viewProfile}
          </Button>
        </Link>
      </div>

      {/* Report Link - small and subtle */}
      <div className="text-center pt-2">
        <Link
          href={`/listing/${listingId}?action=report${browseQuery ? `&${browseQuery}` : ""}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {text.report}
        </Link>
      </div>
    </div>
  );
}
