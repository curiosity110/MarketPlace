import Link from "next/link";
import { AlertTriangle, MessageCircle, Phone, UserRound } from "lucide-react";
import { ContactSellerPopout } from "@/components/contact-seller-popout";
import { Button } from "@/components/ui/button";
import { SellerCard as BaseSellerCard } from "@/components/ui/layout";
import type { ListingDetailsSellerCardProps } from "@/features/listing-details/types";

export function ListingSellerCard({
  locale,
  listingId,
  sellerId,
  sellerNameOrEmail,
  sellerPhone,
  isOwner,
  isSold,
  browseQuery,
  whatsappHref,
  text,
}: ListingDetailsSellerCardProps) {
  void whatsappHref;

  const reportAction = !isOwner ? (
    <details className="relative">
      <summary className="list-none">
        <span className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground">
          <AlertTriangle size={14} className="mr-1" />
          {text.report}
        </span>
      </summary>
      <div className="absolute right-0 top-11 z-20 w-[min(92vw,360px)] max-w-full rounded-xl border border-border/80 bg-background p-3 shadow-xl">
        <p className="text-sm font-semibold">{text.reportListing}</p>
        <form action="/api/reports" method="post" className="mt-3 space-y-2">
          <input type="hidden" name="targetType" value="LISTING" />
          <input type="hidden" name="targetId" value={listingId} />
          <input type="hidden" name="listingId" value={listingId} />
          <input type="hidden" name="locale" value={locale} />
          <input
            type="hidden"
            name="returnTo"
            value={browseQuery ? `/listing/${listingId}?${browseQuery}` : `/listing/${listingId}`}
          />
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            <span>{text.reportReason}</span>
            <select
              name="reasonCode"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              defaultValue="fake"
            >
              <option value="fake">{text.reportReasonFake}</option>
              <option value="scam">{text.reportReasonScam}</option>
              <option value="spam">{text.reportReasonSpam}</option>
              <option value="other">{text.reportReasonOther}</option>
            </select>
          </label>
          <textarea
            name="details"
            maxLength={500}
            className="min-h-24 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
            placeholder={text.reportDetails}
          />
          <Button type="submit" variant="outline" className="w-full justify-center gap-2">
            <AlertTriangle size={16} />
            {text.submitReport}
          </Button>
        </form>
      </div>
    </details>
  ) : null;

  const primaryAction =
    !isOwner && !isSold ? (
      sellerPhone ? (
        <a href={`tel:${sellerPhone}`} className="block">
          <Button className="w-full gap-2">
            <MessageCircle size={15} />
            {text.contactSeller}
          </Button>
        </a>
      ) : (
        <ContactSellerPopout listingId={listingId} locale={locale} className="w-full justify-center" />
      )
    ) : null;

  const secondaryActions =
    !isOwner && !isSold && sellerPhone ? (
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <a href={`tel:${sellerPhone}`} className="shrink-0">
          <Button type="button" variant="outline" className="h-10 w-10 p-0" aria-label={text.call}>
            <Phone size={15} />
          </Button>
        </a>
        <Link href={`/seller/${sellerId}`} className="min-w-0">
          <Button variant="ghost" className="w-full">
            {text.viewProfile}
          </Button>
        </Link>
      </div>
    ) : (
      <Link href={`/seller/${sellerId}`} className="block">
        <Button variant="outline" className="w-full">
          {text.viewProfile}
        </Button>
      </Link>
    );

  return (
    <BaseSellerCard
      title={text.seller}
      headingAction={reportAction}
      identity={
        <p className="inline-flex max-w-full items-center gap-2 break-words [overflow-wrap:anywhere]">
          <UserRound size={16} className="text-muted-foreground" />
          {sellerNameOrEmail}
        </p>
      }
      primaryValue={<span>{sellerPhone || text.phoneNotSet}</span>}
      actions={
        <div className="space-y-2">
          {primaryAction}
          {secondaryActions}
        </div>
      }
    />
  );
}
