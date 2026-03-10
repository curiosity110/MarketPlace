"use client";

import { MessageCircle, Phone } from "lucide-react";
import { ContactSellerPopout } from "@/components/contact-seller-popout";
import { Button } from "@/components/ui/button";

type Props = {
  listingId: string;
  locale: "en" | "mk";
  sellerPhone: string | null;
  whatsappHref: string | null;
  isOwner: boolean;
  isSold: boolean;
  text: { contactSeller: string; call: string; whatsapp: string };
};

export function ListingContactCta({
  listingId,
  locale,
  sellerPhone,
  whatsappHref,
  isOwner,
  isSold,
  text,
}: Props) {
  if (isOwner || isSold) return null;

  return (
    <section
      className="rounded-[1.35rem] border border-orange-200/60 bg-orange-50/50 p-4 dark:border-orange-900/40 dark:bg-orange-950/20 sm:p-5"
      aria-label={text.contactSeller}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {sellerPhone ? (
          <a href={`tel:${sellerPhone}`} className="block flex-1 min-w-0 sm:min-w-[200px]">
            <Button
              size="lg"
              className="h-12 w-full rounded-full bg-orange-500 font-semibold text-white hover:bg-orange-600"
            >
              <Phone size={18} className="mr-2" />
              {text.contactSeller}
            </Button>
          </a>
        ) : (
          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <ContactSellerPopout
              listingId={listingId}
              locale={locale}
              className="h-12 w-full justify-center rounded-full bg-orange-500 font-semibold text-white hover:bg-orange-600"
            />
          </div>
        )}
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="block">
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-full border-green-300 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200 dark:hover:bg-green-900/40"
            >
              <MessageCircle size={18} />
              {text.whatsapp}
            </Button>
          </a>
        )}
        {sellerPhone && (
          <a href={`tel:${sellerPhone}`} className="block">
            <Button size="lg" variant="outline" className="h-12 gap-2 rounded-full">
              <Phone size={18} />
              {text.call}
            </Button>
          </a>
        )}
      </div>
    </section>
  );
}
