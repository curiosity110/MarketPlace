"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  formatListingCardDate,
  ListingCardMedia,
  ListingCardMeta,
  ListingCardTag,
} from "@/components/listing-card/shared";
import { Button } from "@/components/ui/button";
import { ListingCardBase } from "@/components/ui/layout";
import { MarkSoldPopout } from "@/components/mark-sold-popout";
import { localizeCategoryName } from "@/lib/category-label";
import { cn } from "@/lib/utils";
import type { DashboardLayout, DashboardListingItem } from "@/features/dashboard/types";

export type { DashboardListingItem } from "@/features/dashboard/types";

type Props = {
  listing: DashboardListingItem;
  locale: "mk" | "en";
  layout: DashboardLayout;
  text: {
    statusActive: string;
    statusDraft: string;
    statusExpired: string;
    statusSold: string;
    updated: string;
    ends: string;
    soldOn: string;
    edit: string;
    view: string;
    payAndPublish: string;
    openEditHint: string;
    expiredHint: string;
    soldHint: string;
    publishFree: string;
    firstPublishFreeHint: string;
    publishWithSubscription: string;
    subscriptionPublishHint: string;
  };
  requiresPaymentForCreate: boolean;
  hasActiveSubscription: boolean;
  publishDraftAction: (formData: FormData) => void | Promise<void>;
};

function formatPrice(amountCents: number, currency: string, locale: "mk" | "en") {
  const normalizedCurrency = currency === "EUR" ? "EUR" : "MKD";
  const numberLocale =
    normalizedCurrency === "MKD" ? "mk-MK" : locale === "mk" ? "mk-MK" : "de-DE";
  return new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amountCents / 100));
}

function getStatusVariant(
  listing: DashboardListingItem,
): "success" | "warning" | "destructive" | "secondary" {
  if (listing.sale) return "secondary";
  if (listing.status === "ACTIVE") return "success";
  if (listing.status === "DRAFT") return "warning";
  return "destructive";
}

function DashboardListingCardComponent({
  listing,
  locale,
  layout,
  text,
  requiresPaymentForCreate,
  hasActiveSubscription,
  publishDraftAction,
}: Props) {
  void hasActiveSubscription;
  const isSold = Boolean(listing.sale);
  const isActive = listing.status === "ACTIVE";
  const isDraft = listing.status === "DRAFT";
  const statusLabel = isSold
    ? text.statusSold
    : isActive
      ? text.statusActive
      : isDraft
        ? text.statusDraft
        : text.statusExpired;
  const listingHref = `/listing/${listing.id}`;
  const editHref = `/sell/${listing.id}/edit`;
  const summaryItems = [
    listing.city.name,
    localizeCategoryName(listing.category, locale),
    `${text.updated} ${formatListingCardDate(listing.updatedAt, locale)}`,
  ];
  const timelineLabel = listing.sale?.soldAt
    ? `${text.soldOn} ${formatListingCardDate(listing.sale.soldAt, locale)}`
    : listing.activeUntil && !isSold
      ? `${text.ends} ${formatListingCardDate(listing.activeUntil, locale)}`
      : null;

  return (
    <ListingCardBase
      className={cn(layout === "list" ? "lg:grid lg:grid-cols-[220px_minmax(0,1fr)]" : "")}
      bodyClassName="flex h-full min-w-0 flex-col"
      media={
        <ListingCardMedia
          href={listingHref}
          title={listing.title}
          imageUrl={listing.images[0]?.url}
          emptyLabel={locale === "mk" ? "Нема слика" : "No image"}
          price={formatPrice(listing.priceCents, listing.currency, locale)}
          sizes={layout === "list" ? "(max-width: 1024px) 100vw, 220px" : "(max-width: 768px) 100vw, 33vw"}
          imageClassName={layout === "list" ? "lg:group-hover/media:scale-[1.02]" : undefined}
          topLeft={
            <ListingCardTag variant={getStatusVariant(listing)}>
              {statusLabel}
            </ListingCardTag>
          }
          topRight={
            <>
              <Link href={editHref} className="relative z-30">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 border-white/50 bg-background/92 p-0 backdrop-blur"
                  aria-label={text.edit}
                >
                  <Pencil size={14} />
                </Button>
              </Link>
              {!isSold ? (
                <MarkSoldPopout
                  listingId={listing.id}
                  locale={locale}
                  defaultPriceCents={listing.priceCents}
                  iconOnly
                  className="h-9 w-9 border-white/50 bg-background/92 p-0 backdrop-blur"
                />
              ) : null}
            </>
          }
        />
      }
      body={
        <>
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-[1.02rem] font-semibold leading-tight tracking-tight">
              <Link href={listingHref} className="hover:underline">
                {listing.title}
              </Link>
            </h3>
            <ListingCardMeta items={summaryItems} />
            {timelineLabel ? <p className="text-xs text-muted-foreground">{timelineLabel}</p> : null}
          </div>

          <div className="mt-auto space-y-2 pt-1">
            {isSold ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href={listingHref}>
                    <Button size="sm" className="w-full">{text.view}</Button>
                  </Link>
                  <Link href={editHref}>
                    <Button size="sm" variant="outline" className="w-full">{text.edit}</Button>
                  </Link>
                </div>
              </>
            ) : isActive ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Link href={editHref}>
                  <Button size="sm" className="w-full">{text.edit}</Button>
                </Link>
                <Link href={listingHref}>
                  <Button size="sm" variant="outline" className="w-full">{text.view}</Button>
                </Link>
              </div>
            ) : isDraft ? (
              requiresPaymentForCreate ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={editHref}>
                      <Button size="sm" variant="outline" className="w-full">{text.edit}</Button>
                    </Link>
                    <Link href={editHref}>
                      <Button size="sm" className="w-full">{text.payAndPublish}</Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <form action={publishDraftAction}>
                      <input type="hidden" name="id" value={listing.id} />
                      <PublishDraftButton label={text.publishFree} />
                    </form>
                    <Link href={editHref}>
                      <Button size="sm" variant="outline" className="w-full">{text.edit}</Button>
                    </Link>
                  </div>
                </>
              )
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href={editHref}>
                    <Button size="sm" variant="outline" className="w-full">{text.edit}</Button>
                  </Link>
                  <Link href={editHref}>
                    <Button size="sm" className="w-full">
                      {requiresPaymentForCreate ? text.payAndPublish : text.publishWithSubscription}
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </>
      }
    />
  );
}

export const DashboardListingCard = React.memo(DashboardListingCardComponent);

DashboardListingCard.displayName = "DashboardListingCard";

function PublishDraftButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button size="sm" type="submit" className="w-full" disabled={pending}>
      {label}
    </Button>
  );
}
