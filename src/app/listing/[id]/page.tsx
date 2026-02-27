import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactRequestStatus, ListingStatus } from "@prisma/client";
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

export default async function ListingDetails({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const contactState =
    typeof sp.contact === "string" ? sp.contact.trim().toLowerCase() : "";
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

  let latestContactRequest: {
    id: string;
    status: ContactRequestStatus;
    message: string;
    sellerResponse: string | null;
    createdAt: Date;
  } | null = null;

  if (sessionUser && !isOwner) {
    try {
      latestContactRequest = await prisma.contactRequest.findFirst({
        where: {
          listingId: listing.id,
          requesterUserId: sessionUser.id,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          message: true,
          sellerResponse: true,
          createdAt: true,
        },
      });
      markPrismaHealthy();
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
      } else {
        throw error;
      }
    }
  }

  const valuesByKey = Object.fromEntries(
    listing.fieldValues.map((field) => [field.key, field.value]),
  );

  const categoryLabel = listing.category.parent
    ? `${listing.category.parent.name} / ${listing.category.name}`
    : listing.category.name;

  const isApproved =
    latestContactRequest?.status === ContactRequestStatus.APPROVED;
  const isPending =
    latestContactRequest?.status === ContactRequestStatus.PENDING;
  const isRejected =
    latestContactRequest?.status === ContactRequestStatus.REJECTED;
  const canSeePhone = Boolean(listing.seller.phone) && (isOwner || isApproved);

  const contactNoticeByState: Record<string, { className: string; text: string }> = {
    requested: {
      className: "border-success/30 bg-success/10 text-success",
      text: "Phone access request sent. Seller will review it.",
    },
    pending: {
      className: "border-warning/30 bg-warning/10 text-foreground",
      text: "You already have a pending request for this listing.",
    },
    invalid: {
      className: "border-destructive/30 bg-destructive/5 text-destructive",
      text: "Please add a short reason (minimum 8 characters).",
    },
    self: {
      className: "border-warning/30 bg-warning/10 text-foreground",
      text: "You cannot request your own listing.",
    },
    dberror: {
      className: "border-warning/30 bg-warning/10 text-foreground",
      text: "Database is temporarily unavailable. Please retry.",
    },
  };
  const contactNotice = contactNoticeByState[contactState] || null;

  return (
    <div className="space-y-6">
      {contactNotice && (
        <Card className={contactNotice.className}>
          <CardContent className="py-4 text-sm">{contactNotice.text}</CardContent>
        </Card>
      )}

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
            {listing.currency} {(listing.priceCents / 100).toFixed(2)}
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

              {canSeePhone ? (
                <div className="rounded-xl border border-success/35 bg-success/10 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-success">
                    Seller phone
                  </p>
                  <p className="text-lg font-bold">{listing.seller.phone}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                  Phone is hidden until seller approves your request.
                </div>
              )}

              {isOwner ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You can manage your phone visibility from your seller profile.
                  </p>
                  <Link href="/sell/analytics" className="block">
                    <Button variant="outline" className="w-full">
                      Manage phone in profile
                    </Button>
                  </Link>
                </div>
              ) : !sessionUser ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Login to request phone access and send a reason to the seller.
                  </p>
                  <Link href={`/login?next=/listing/${listing.id}`} className="block">
                    <Button className="w-full">Login to request phone</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {latestContactRequest && (
                    <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                      <p className="font-semibold">Latest request</p>
                      <p className="text-muted-foreground">
                        Status: {latestContactRequest.status}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Sent {new Date(latestContactRequest.createdAt).toLocaleDateString()}
                      </p>
                      {latestContactRequest.sellerResponse && (
                        <p className="mt-1 text-muted-foreground">
                          Seller note: {latestContactRequest.sellerResponse}
                        </p>
                      )}
                    </div>
                  )}

                  {isApproved && !listing.seller.phone && (
                    <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
                      Seller approved access but has not added a phone number yet.
                    </div>
                  )}

                  {!isPending && (!isApproved || !listing.seller.phone) && (
                    <form
                      action="/api/contact-requests"
                      method="post"
                      className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3"
                    >
                      <input type="hidden" name="listingId" value={listing.id} />
                      <label className="space-y-1">
                        <span className="text-sm font-medium">
                          Why do you need seller phone access?
                        </span>
                        <textarea
                          name="message"
                          required
                          minLength={8}
                          className="min-h-20 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
                          placeholder="Example: I am ready to buy and want pickup details."
                        />
                      </label>
                      <Button type="submit" className="w-full">
                        {isRejected ? "Send new request" : "Request phone access"}
                      </Button>
                    </form>
                  )}
                </div>
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
