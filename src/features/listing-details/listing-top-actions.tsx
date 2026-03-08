"use client";

import { useState } from "react";
import { AlertTriangle, Share2 } from "lucide-react";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { Button } from "@/components/ui/button";
import { ListingOwnerActions } from "@/features/listing-details/listing-owner-actions";
import type { ListingDetailsTopActionsProps } from "@/features/listing-details/types";

export function ListingTopActions({
  locale,
  listingId,
  priceCents,
  isOwner,
  isAuthenticated,
  isFavorited,
  isSold,
  browseQuery,
  text,
}: ListingDetailsTopActionsProps) {
  const [reportOpen, setReportOpen] = useState(false);

  const shareListing = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        return;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 text-muted-foreground"
        aria-label={text.share}
        onClick={shareListing}
      >
        <Share2 size={16} />
      </Button>

      {isOwner ? (
        <ListingOwnerActions
          listingId={listingId}
          priceCents={priceCents}
          locale={locale}
          isSold={isSold}
          text={text}
        />
      ) : (
        <>
          <FavoriteToggleButton
            listingId={listingId}
            locale={locale}
            isAuthenticated={isAuthenticated}
            initialFavorited={isFavorited}
            iconOnly
            className="h-9 w-9 rounded-full border-border/55"
          />

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-muted-foreground"
              aria-label={text.report}
              onClick={() => setReportOpen((prev) => !prev)}
            >
              <AlertTriangle size={16} />
            </Button>

            {reportOpen ? (
              <div className="absolute right-0 top-11 z-20 w-[min(92vw,340px)] rounded-[1.2rem] border border-border/55 bg-background/96 p-3 shadow-[0_24px_64px_-32px_rgba(48,35,24,0.32)] backdrop-blur-xl">
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
                      className="h-10 w-full rounded-full border border-input bg-background px-4 text-sm text-foreground"
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
                    className="min-h-24 w-full rounded-[1rem] border border-border/55 bg-input px-3 py-2 text-sm"
                    placeholder={text.reportDetails}
                  />
                  <Button type="submit" variant="outline" className="w-full justify-center gap-2">
                    <AlertTriangle size={16} />
                    {text.submitReport}
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
