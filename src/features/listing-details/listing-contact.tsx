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
    <div className="space-y-4">
      {/* Seller Info */}
      <div>
        <p className="text-sm font-medium text-foreground">{text.seller}</p>
        <p className="text-base font-semibold text-foreground">{sellerName}</p>
      </div>

      {/* Contact Methods - vertical stack on mobile, horizontal on desktop */}
      <div className="grid gap-3 sm:gap-2 grid-cols-1 sm:grid-cols-2">
        {/* Primary CTA: Contact Seller */}
        {sellerPhone ? (
          <a href={`tel:${sellerPhone}`} className="sm:col-span-2">
            <Button size="lg" className="w-full gap-2 h-11">
              <Phone size={16} />
              <span>{text.contactSeller}</span>
            </Button>
          </a>
        ) : (
          <div className="sm:col-span-2">
            <ContactSellerPopout
              listingId={listingId}
              locale={locale}
              className="w-full h-11 justify-center"
            />
          </div>
        )}

        {/* Secondary: WhatsApp if available */}
        {sellerPhone && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="w-full h-11">
              WhatsApp
            </Button>
          </a>
        )}

        {/* View Profile */}
        <Link href={`/seller/${sellerId}${browseQuery ? `?${browseQuery}` : ""}`}>
          <Button variant="outline" size="lg" className="w-full h-11">
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
