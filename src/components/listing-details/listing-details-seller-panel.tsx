import Link from "next/link";
import { MessageCircle, Phone, ShieldAlert, UserRound } from "lucide-react";
import { ContactSellerPopout } from "@/components/contact-seller-popout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  locale: "en" | "mk";
  listingId: string;
  sellerId: string;
  sellerNameOrEmail: string;
  sellerPhone: string | null;
  isOwner: boolean;
  isSold: boolean;
  backToBrowseHref: string;
  browseQuery: string;
  whatsappHref: string | null;
  text: {
    seller: string;
    report: string;
    reportListing: string;
    reportHelp: string;
    reportReason: string;
    reportReasonFake: string;
    reportReasonScam: string;
    reportReasonSpam: string;
    reportReasonOther: string;
    reportDetails: string;
    submitReport: string;
    sellerContact: string;
    phone: string;
    phoneNotSet: string;
    viewProfile: string;
    backToBrowse: string;
    contactSeller: string;
    call: string;
    whatsapp: string;
  };
};

export function ListingDetailsSellerPanel({
  locale,
  listingId,
  sellerId,
  sellerNameOrEmail,
  sellerPhone,
  isOwner,
  isSold,
  backToBrowseHref,
  browseQuery,
  whatsappHref,
  text,
}: Props) {
  void text.reportHelp;
  void text.sellerContact;
  void text.phone;
  return (
    <Card className="max-w-full shadow-none">
      <CardContent className="min-w-0 max-w-full space-y-4 p-4 sm:p-5">
        <div className="flex max-w-full items-start justify-between gap-3">
          <h2 className="min-w-0 break-words text-lg font-semibold [overflow-wrap:anywhere]">
            {text.seller}
          </h2>
          {!isOwner ? (
            <details className="relative">
              <summary className="list-none">
                <span className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground">
                  <ShieldAlert size={14} className="mr-1" />
                  {text.report}
                </span>
              </summary>
              <div className="absolute right-0 top-11 z-20 w-[min(92vw,360px)] max-w-full rounded-xl border border-border/80 bg-background p-3 shadow-xl">
                <p className="text-sm font-semibold">{text.reportListing}</p>
                <form action="/api/reports" method="post" className="mt-2 space-y-2">
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
                    <ShieldAlert size={16} />
                    {text.submitReport}
                  </Button>
                </form>
              </div>
            </details>
          ) : null}
        </div>
        <div className="max-w-full space-y-3 rounded-2xl bg-muted/28 p-4 ring-1 ring-black/5 dark:ring-white/10">
          <p className="inline-flex max-w-full items-center gap-2 break-words text-sm font-semibold [overflow-wrap:anywhere]">
            <UserRound size={16} className="text-muted-foreground" />
            {sellerNameOrEmail}
          </p>
          <div className="rounded-xl bg-background/90 px-3 py-3 ring-1 ring-success/15">
            <p className="max-w-full break-words text-xl font-semibold tracking-tight [overflow-wrap:anywhere]">
              {sellerPhone || text.phoneNotSet}
            </p>
          </div>
        </div>

        {!isOwner && !isSold ? (
          <div className="space-y-2">
            {sellerPhone ? (
              <div className="grid max-w-full grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
                <a href={`tel:${sellerPhone}`} className="min-w-0">
                  <Button className="w-full gap-2">
                    <MessageCircle size={15} />
                    <span className="truncate">{text.contactSeller}</span>
                  </Button>
                </a>
                <a href={`tel:${sellerPhone}`} className="shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 p-0"
                    aria-label={text.call}
                  >
                    <Phone size={15} />
                  </Button>
                </a>
                {whatsappHref ? (
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-10 p-0"
                      aria-label={text.whatsapp}
                    >
                      <MessageCircle size={15} />
                    </Button>
                  </a>
                ) : (
                  <ContactSellerPopout
                    listingId={listingId}
                    locale={locale}
                    iconOnly
                    className="h-10 w-10 p-0"
                  />
                )}
              </div>
            ) : (
              <ContactSellerPopout
                listingId={listingId}
                locale={locale}
                className="w-full justify-center"
              />
            )}
          </div>
        ) : null}

        <div className="flex max-w-full flex-wrap gap-2">
          <Link href={`/seller/${sellerId}`} className="min-w-0 flex-1">
            <Button variant="outline" className="w-full rounded-xl">
              {text.viewProfile}
            </Button>
          </Link>
          <Link href={backToBrowseHref} className="min-w-0 flex-1" scroll={false}>
            <Button variant="ghost" className="w-full rounded-xl">
              {text.backToBrowse}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
