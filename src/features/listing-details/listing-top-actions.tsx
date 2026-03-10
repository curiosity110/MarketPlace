"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const canPortal = typeof document !== "undefined";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(media.matches);
    sync();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    if (!reportOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setReportOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setReportOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [reportOpen]);

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

  const reportPanel = (
    <div
      ref={panelRef}
      className={
        isMobile
          ? "fixed inset-x-3 bottom-[calc(5.9rem+env(safe-area-inset-bottom))] z-[95] rounded-[1.25rem] border border-border/55 bg-background/98 p-3 shadow-[0_24px_64px_-32px_rgba(48,35,24,0.32)] backdrop-blur-xl sm:hidden"
          : "absolute right-0 top-11 z-20 w-[min(92vw,340px)] rounded-[1.2rem] border border-border/55 bg-background/96 p-3 shadow-[0_24px_64px_-32px_rgba(48,35,24,0.32)] backdrop-blur-xl"
      }
    >
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
  );

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

          <div ref={triggerRef} className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-muted-foreground"
              aria-label={text.report}
              aria-expanded={reportOpen}
              aria-haspopup="dialog"
              onClick={() => setReportOpen((prev) => !prev)}
            >
              <AlertTriangle size={16} />
            </Button>

            {reportOpen && !isMobile ? reportPanel : null}
          </div>

          {reportOpen && isMobile && canPortal
            ? createPortal(
                <div className="fixed inset-0 z-[94] sm:hidden">
                  <button
                    type="button"
                    aria-label={text.report}
                    className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
                    onClick={() => setReportOpen(false)}
                  />
                  {reportPanel}
                </div>,
                document.body,
              )
            : null}
        </>
      )}
    </div>
  );
}
