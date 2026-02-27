import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyFromCents } from "@/lib/currency";

export default async function ListingDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
            Listing details are temporarily unavailable because the database is unreachable.
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

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              {listing.images.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {listing.images.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/70 bg-muted"
                    >
                      <Image
                        src={image.url}
                        alt={`${listing.title} image ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex aspect-[5/3] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                  No photos uploaded
                </div>
              )}

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Description</h2>
                <p className="whitespace-pre-wrap text-sm text-foreground/90">
                  {listing.description}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <h2 className="text-xl font-semibold">Category details</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {listing.category.fieldTemplates.map((template) => {
                  const value = valuesByKey[template.key];
                  if (!value) return null;
                  return (
                    <div
                      key={template.id}
                      className="rounded-xl border border-border/70 bg-muted/30 p-3"
                    >
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {template.label}
                      </p>
                      <p className="text-sm font-semibold">{value}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <h2 className="text-lg font-semibold">Seller</h2>
              <p className="inline-flex items-center gap-2 text-sm">
                <UserRound size={16} className="text-muted-foreground" />
                {listing.seller.name || listing.seller.email}
              </p>
              <Badge variant="secondary">Member since marketplace launch</Badge>

              <div className="rounded-xl border border-success/35 bg-success/10 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-success">
                  Seller phone
                </p>
                <p className="text-lg font-bold">
                  {listing.seller.phone || "Phone not set yet"}
                </p>
              </div>

              {isOwner && (
                <Link href="/sell/analytics" className="block">
                  <Button variant="outline" className="w-full">
                    Manage seller profile
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <h2 className="text-lg font-semibold">Report this listing</h2>
              <p className="text-sm text-muted-foreground">
                If something looks unsafe or fake, report it for review.
              </p>
              <form action="/api/reports" method="post" className="space-y-2">
                <input type="hidden" name="targetType" value="LISTING" />
                <input type="hidden" name="targetId" value={listing.id} />
                <input type="hidden" name="listingId" value={listing.id} />
                <textarea
                  name="reason"
                  required
                  minLength={8}
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <h2 className="text-lg font-semibold">More actions</h2>
              <Link href="/browse" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  Back to browse
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
