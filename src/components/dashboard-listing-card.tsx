"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localizeCategoryName } from "@/lib/category-label";
import { cn } from "@/lib/utils";

export type DashboardListingItem = {
  id: string;
  title: string;
  status: string;
  priceCents: number;
  currency: string;
  categoryId: string;
  updatedAt: string;
  activeUntil: string | null;
  category: {
    id: string;
    name: string;
    slug: string | null;
  };
  city: {
    id: string;
    name: string;
  };
  images: { url: string }[];
  sale: {
    soldAt: string;
  } | null;
};

type ListingLayout = "grid" | "list";

type ListingCardText = {
  status: string;
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

type Props = {
  listing: DashboardListingItem;
  locale: "mk" | "en";
  layout: ListingLayout;
  text: ListingCardText;
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

export function DashboardListingCard({
  listing,
  locale,
  layout,
  text,
  requiresPaymentForCreate,
  hasActiveSubscription,
  publishDraftAction,
}: Props) {
  const isMk = locale === "mk";
  const heroImage = listing.images[0]?.url;
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
  const updatedDate = new Date(listing.updatedAt).toLocaleDateString(
    isMk ? "mk-MK" : "en-US",
  );

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-primary/30",
        layout === "list"
          ? "grid gap-0 lg:grid-cols-[260px_1fr]"
          : "flex flex-col",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          layout === "list" ? "h-44 lg:h-auto" : "h-44",
        )}
      >
        {heroImage ? (
          <Image
            src={heroImage}
            alt={listing.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={layout === "list" ? "(max-width: 1024px) 100vw, 260px" : "(max-width: 768px) 100vw, 33vw"}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/25 to-transparent" />

        <div className="absolute right-3 top-3">
          <Badge variant={getStatusVariant(listing)} className="bg-background/90">
            <span className="mr-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              {text.status}
            </span>
            {statusLabel}
          </Badge>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <p className="line-clamp-1 text-lg font-black">{listing.title}</p>
          <p className="text-xs text-white/85">
            {text.updated} {updatedDate}
          </p>
        </div>
      </div>

      <div className="flex min-h-full flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-muted/20 px-2 py-0.5">
            {listing.city.name}
          </span>
          <span className="rounded-full border border-border/70 bg-muted/20 px-2 py-0.5">
            {localizeCategoryName(listing.category, locale)}
          </span>
        </div>

        <p className="text-2xl font-black text-primary">
          {formatPrice(listing.priceCents, listing.currency, locale)}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getStatusVariant(listing)}>{statusLabel}</Badge>
          {listing.activeUntil && (
            <Badge variant="warning">
              {text.ends}{" "}
              {new Date(listing.activeUntil).toLocaleDateString(
                isMk ? "mk-MK" : "en-US",
              )}
            </Badge>
          )}
        </div>

        <div className="mt-auto space-y-2">
          {isSold ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link href={`/sell/${listing.id}/edit`}>
                  <Button size="sm" className="w-full">
                    {text.edit}
                  </Button>
                </Link>
                <Link href={`/listing/${listing.id}`}>
                  <Button size="sm" variant="ghost" className="w-full">
                    {text.view}
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">{text.soldHint}</p>
              {listing.sale?.soldAt ? (
                <p className="text-xs text-muted-foreground">
                  {text.soldOn}{" "}
                  {new Date(listing.sale.soldAt).toLocaleDateString(
                    isMk ? "mk-MK" : "en-US",
                  )}
                </p>
              ) : null}
            </>
          ) : isActive ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href={`/sell/${listing.id}/edit`}>
                <Button size="sm" className="w-full">
                  {text.edit}
                </Button>
              </Link>
              <Link href={`/listing/${listing.id}`}>
                <Button size="sm" variant="ghost" className="w-full">
                  {text.view}
                </Button>
              </Link>
            </div>
          ) : isDraft ? (
            requiresPaymentForCreate ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href={`/sell/${listing.id}/edit`}>
                    <Button size="sm" variant="outline" className="w-full">
                      {text.edit}
                    </Button>
                  </Link>
                  <Link href={`/sell/${listing.id}/edit`}>
                    <Button size="sm" className="w-full">
                      {text.payAndPublish}
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">{text.openEditHint}</p>
              </>
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href={`/sell/${listing.id}/edit`}>
                    <Button size="sm" variant="outline" className="w-full">
                      {text.edit}
                    </Button>
                  </Link>
                  <form action={publishDraftAction}>
                    <input type="hidden" name="id" value={listing.id} />
                    <Button size="sm" type="submit" className="w-full">
                      {text.publishFree}
                    </Button>
                  </form>
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasActiveSubscription
                    ? text.subscriptionPublishHint
                    : text.firstPublishFreeHint}
                </p>
              </>
            )
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link href={`/sell/${listing.id}/edit`}>
                  <Button size="sm" variant="outline" className="w-full">
                    {text.edit}
                  </Button>
                </Link>
                <Link href={`/sell/${listing.id}/edit`}>
                  <Button size="sm" className="w-full">
                    {requiresPaymentForCreate
                      ? text.payAndPublish
                      : text.publishWithSubscription}
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">{text.expiredHint}</p>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
