import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingStatus } from "@prisma/client";
import { MapPin, ShieldAlert, UserRound } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { ListingGallery } from "@/components/listing-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyFromCents } from "@/lib/currency";

export default async function ListingDetails({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const reportSaved = sp.reported === "1";
  const reportError = sp.error;
  const sessionUser = await getSessionUser();

  async function fetchListingDetails() {
    return prisma.listing.findFirst({
      where: { id, status: ListingStatus.ACTIVE },
      include: {
        city: true,
        category: {
          include: {
            parent: true,
            fieldTemplates: {
              where: { isActive: true },
              orderBy: { order: "asc" },
            },
          },
        },
        images: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        fieldValues: true,
      },
    });
  }

  let listing: Awaited<ReturnType<typeof fetchListingDetails>> = null;
  let dbUnavailable = false;

  try {
    if (!shouldSkipPrismaCalls()) {
      listing = await fetchListingDetails();
      markPrismaHealthy();
    } else {
      dbUnavailable = true;
    }
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      dbUnavailable = true;
    } else {
      throw error;
    }
  }

  if (dbUnavailable) {
    return (
      <div className="space-y-4">
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-5 text-sm text-foreground">
            Listing details are temporarily unavailable because the database is
            unreachable.
          </CardContent>
        </Card>
        <Link href="/browse">
          <Button variant="outline">Back to browse</Button>
        </Link>
      </div>
    );
  }

  if (!listing) notFound();

  const isOwner = sessionUser?.id === listing.seller.id;
  const valuesByKey = Object.fromEntries(
    listing.fieldValues.map((field) => [field.key, field.value]),
  );
  const categoryDetails = listing.category.fieldTemplates
    .map((template) => {
      const value = valuesByKey[template.key];
      if (!value) return null;
      return {
        id: template.id,
        label: template.label,
        value,
      };
    })
    .filter((item): item is { id: string; label: string; value: string } =>
      Boolean(item),
    );

  const categoryLabel = listing.category.parent
    ? `${listing.category.parent.name} / ${listing.category.name}`
    : listing.category.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold sm:text-4xl">{listing.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} />
              {listing.city.name}
            </span>
            <span>|</span>
            <span>{categoryLabel}</span>
            <span>|</span>
            <span>{listing.condition}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-orange-50/70 px-4 py-2 text-right dark:bg-orange-950/20">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Price
          </p>
          <p className="text-3xl font-black text-primary">
            {formatCurrencyFromCents(listing.priceCents, listing.currency)}
          </p>
        </div>
      </div>

      {reportSaved && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-3 text-sm text-success">
            Report submitted. Thank you for helping keep the marketplace safe.
          </CardContent>
        </Card>
      )}
      {reportError && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-3 text-sm text-foreground">
            {reportError}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <ListingGallery
                images={listing.images.map((image) => image.url)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <h2 className="text-xl font-semibold">Description</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                  {listing.description}
                </p>
              </div>

              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">Category details</h2>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  {categoryDetails.length}
                </span>
              </div>

              {categoryDetails.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {categoryDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="rounded-xl border border-border/70 bg-muted/20 p-3"
                    >
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {detail.label}
                      </p>
                      <p className="text-sm font-semibold">{detail.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No category details were provided.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">Seller</h2>
                <details className="relative">
                  <summary className="list-none">
                    <Button type="button" variant="outline" size="sm">
                      <ShieldAlert size={14} className="mr-1" />
                      Report
                    </Button>
                  </summary>
                  <div className="absolute right-0 top-11 z-20 w-[min(92vw,360px)] rounded-xl border border-border/80 bg-background p-3 shadow-xl">
                    <p className="text-sm font-semibold">Report this listing</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      If something looks unsafe or fake, report it for review.
                    </p>
                    <form
                      action="/api/reports"
                      method="post"
                      className="mt-2 space-y-2"
                    >
                      <input type="hidden" name="targetType" value="LISTING" />
                      <input type="hidden" name="targetId" value={listing.id} />
                      <input
                        type="hidden"
                        name="listingId"
                        value={listing.id}
                      />
                      <input
                        type="hidden"
                        name="returnTo"
                        value={`/listing/${listing.id}`}
                      />
                      <textarea
                        name="reason"
                        required
                        minLength={8}
                        maxLength={500}
                        className="min-h-24 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
                        placeholder="Explain why this listing should be reviewed"
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full justify-center gap-2"
                      >
                        <ShieldAlert size={16} />
                        Submit report
                      </Button>
                    </form>
                  </div>
                </details>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <details>
                  <summary className="list-none">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-center"
                    >
                      Seller profile
                    </Button>
                  </summary>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Seller contact
                    </p>
                    <p className="inline-flex items-center gap-2 text-sm font-semibold">
                      <UserRound size={16} className="text-muted-foreground" />
                      {listing.seller.name || listing.seller.email}
                    </p>
                    <div className="rounded-lg border border-success/35 bg-success/10 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-success">
                        Phone
                      </p>
                      <p className="text-lg font-bold">
                        {listing.seller.phone || "Phone not set yet"}
                      </p>
                    </div>
                  </div>
                </details>
              </div>

              <div className="flex flex-wrap gap-2">
                {isOwner && (
                  <Link href="/profile" className="flex-1 min-w-[160px]">
                    <Button variant="outline" className="w-full">
                      View profile
                    </Button>
                  </Link>
                )}
                <Link href="/browse" className="flex-1 min-w-[160px]">
                  <Button variant="ghost" className="w-full">
                    Back to browse
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
