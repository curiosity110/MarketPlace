import Link from "next/link";
import { ListingStatus, Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Bot,
  CirclePlus,
  Edit3,
  Megaphone,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  isMissingCategoryRequestTableError,
  isPrismaConnectionError,
} from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { getSupabaseServiceConfig } from "@/lib/supabase/config";
import { isLikelySupabaseConnectionError } from "@/lib/supabase/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryRequestForm } from "@/components/category-request-form";
import { CreateListingPopout } from "@/components/create-listing-popout";
import { OpenAssistantButton } from "@/components/open-assistant-button";
import {
  getDynamicFieldEntries,
  groupTemplatesByCategory,
  normalizeTemplates,
  statusFromIntent,
  validatePublishInputs,
} from "@/lib/listing-fields";
import { sendContactDecisionEmail } from "@/lib/notifications";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CREATE_PHOTO_SIZE = 6 * 1024 * 1024; // 6MB
const MAX_CONTACT_RESPONSE_LENGTH = 500;

function contactBadgeVariant(status: "PENDING" | "APPROVED" | "REJECTED") {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "destructive";
  return "warning";
}

function resolveActiveUntil(status: ListingStatus, plan: string) {
  if (status !== ListingStatus.ACTIVE) return null;
  if (plan === "subscription") return null;
  return new Date(Date.now() + THIRTY_DAYS_MS);
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function uploadPhotoForListing(listingId: string, file: File) {
  if (!file.type.startsWith("image/")) {
    return "Photo must be an image file.";
  }

  if (file.size > MAX_CREATE_PHOTO_SIZE) {
    return "Photo must be 6MB or smaller.";
  }

  const supabaseConfig = getSupabaseServiceConfig();
  if (!supabaseConfig) {
    return "Storage is not configured.";
  }

  const supabase = createClient(
    supabaseConfig.url,
    supabaseConfig.serviceRoleKey,
  );
  const safeName = sanitizeFileName(file.name);
  const path = `${listingId}/${Date.now()}-${safeName}`;
  const bucket = supabaseConfig.storageBucket;

  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) return error.message;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    await prisma.listingImage.create({
      data: { listingId, url: data.publicUrl },
    });
  } catch (error) {
    if (isLikelySupabaseConnectionError(error)) {
      return "Storage host is unreachable. Check Supabase URL and DNS.";
    }
    return "Photo upload failed due to a storage error.";
  }

  return null;
}

async function createListing(formData: FormData) {
  "use server";

  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    redirect("/sell?error=Database%20is%20temporarily%20unreachable");
  }

  const intent = String(formData.get("intent") || "draft");
  const status = statusFromIntent(intent);
  const plan = String(formData.get("plan") || "pay-per-listing");
  const paymentProvider = String(formData.get("paymentProvider") || "none");
  let isFirstPublishedPost = false;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const cityId = String(formData.get("cityId") || "");
  const condition = formData.get(
    "condition",
  ) as Prisma.ListingUncheckedCreateInput["condition"];
  const photo = formData.get("photo");
  const price = Number(formData.get("price") || 0);
  const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;

  let templates: Awaited<
    ReturnType<typeof prisma.categoryFieldTemplate.findMany>
  > = [];
  try {
    templates = await prisma.categoryFieldTemplate.findMany({
      where: { categoryId, isActive: true },
      orderBy: { order: "asc" },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/sell?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }
  const dynamicValues = getDynamicFieldEntries(formData);

  if (status === ListingStatus.ACTIVE) {
    try {
      const priorPublishedPosts = await prisma.listing.count({
        where: {
          sellerId: user.id,
          status: { not: ListingStatus.DRAFT },
        },
      });
      isFirstPublishedPost = priorPublishedPosts === 0;
      markPrismaHealthy();
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        redirect("/sell?error=Database%20is%20temporarily%20unreachable");
      }
      throw error;
    }
  }

  if (status === ListingStatus.ACTIVE) {
    if (!isFirstPublishedPost && paymentProvider !== "stripe-dummy") {
      redirect("/sell?error=Dummy%20Stripe%20payment%20is%20required%20before%20activation.");
    }

    const validation = validatePublishInputs({
      title,
      priceCents,
      templates,
      dynamicValues,
    });
    if (!validation.isValid) {
      redirect(`/sell?error=${encodeURIComponent(validation.errors[0])}`);
    }
  }

  let listingId = "";
  try {
    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.create({
        data: {
          sellerId: user.id,
          title,
          description,
          priceCents,
          categoryId,
          cityId,
          condition,
          status,
          activeUntil: resolveActiveUntil(
            status,
            isFirstPublishedPost ? "pay-per-listing" : plan,
          ),
        },
      });

      listingId = listing.id;
      const entries = Object.entries(dynamicValues).filter(
        ([, value]) => value.trim().length > 0,
      );
      if (entries.length > 0) {
        await tx.listingFieldValue.createMany({
          data: entries.map(([key, value]) => ({
            listingId: listing.id,
            key,
            value,
          })),
        });
      }
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/sell?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }

  if (listingId && photo instanceof File && photo.size > 0) {
    const photoUploadError = await uploadPhotoForListing(listingId, photo);
    if (photoUploadError) {
      redirect(
        `/sell?error=${encodeURIComponent(
          `Listing created, but photo upload failed: ${photoUploadError}`,
        )}`,
      );
    }
  }

  revalidatePath("/browse");
  revalidatePath("/sell");
  if (listingId) revalidatePath(`/listing/${listingId}`);
  if (status === ListingStatus.ACTIVE && isFirstPublishedPost) {
    redirect("/sell?free=1");
  }
  if (status === ListingStatus.ACTIVE && paymentProvider === "stripe-dummy") {
    redirect("/sell?paid=1");
  }
  redirect("/sell");
}

async function requestCategory(formData: FormData) {
  "use server";
  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    redirect("/sell?error=Database%20is%20temporarily%20unreachable");
  }

  const desiredName = String(formData.get("desiredName") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const parentIdRaw = String(formData.get("parentId") || "").trim();
  const parentId = parentIdRaw || null;

  if (desiredName.length < 3) {
    redirect(
      "/sell?error=Category%20request%20needs%20at%20least%203%20characters.",
    );
  }

  try {
    await prisma.categoryRequest.create({
      data: {
        requesterId: user.id,
        desiredName,
        description: description || null,
        parentId,
      },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/sell?error=Database%20is%20temporarily%20unreachable");
    }
    if (isMissingCategoryRequestTableError(error)) {
      redirect(
        `/sell?error=${encodeURIComponent(
          "Category requests are unavailable. Run database migrations first.",
        )}`,
      );
    }
    throw error;
  }

  revalidatePath("/sell");
  revalidatePath("/admin");
  redirect("/sell?requested=1");
}

async function respondToContactRequest(formData: FormData) {
  "use server";

  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    redirect("/sell?error=Database%20is%20temporarily%20unreachable");
  }

  const requestId = String(formData.get("requestId") || "").trim();
  const decision = String(formData.get("decision") || "").trim().toUpperCase();
  const sellerResponseRaw = String(formData.get("sellerResponse") || "").trim();
  const sellerResponse =
    sellerResponseRaw.length > 0
      ? sellerResponseRaw.slice(0, MAX_CONTACT_RESPONSE_LENGTH)
      : null;

  if (!requestId || (decision !== "APPROVED" && decision !== "REJECTED")) {
    redirect("/sell?error=Invalid%20contact%20request%20action.");
  }

  let requestRecord: {
    id: string;
    listing: { id: string; title: string };
    requester: { email: string };
    seller: { id: string; email: string; name: string | null; phone: string | null };
  } | null = null;
  try {
    requestRecord = await prisma.contactRequest.findUnique({
      where: { id: requestId },
      include: {
        listing: { select: { id: true, title: true } },
        requester: { select: { email: true } },
        seller: { select: { id: true, email: true, name: true, phone: true } },
      },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/sell?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }

  if (!requestRecord || requestRecord.seller.id !== user.id) {
    redirect("/sell?error=Contact%20request%20not%20found.");
  }

  if (decision === "APPROVED" && !requestRecord.seller.phone) {
    redirect(
      "/sell?error=Add%20your%20phone%20in%20seller%20profile%20before%20approving%20requests.",
    );
  }

  try {
    await prisma.contactRequest.update({
      where: { id: requestRecord.id },
      data: {
        status: decision,
        sellerResponse,
        approvedAt: decision === "APPROVED" ? new Date() : null,
        rejectedAt: decision === "REJECTED" ? new Date() : null,
      },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/sell?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }

  await sendContactDecisionEmail({
    requesterEmail: requestRecord.requester.email,
    sellerIdentity:
      requestRecord.seller.name || requestRecord.seller.email.split("@")[0],
    listingTitle: requestRecord.listing.title,
    approved: decision === "APPROVED",
    sellerResponse,
  });

  revalidatePath("/sell");
  revalidatePath("/sell/analytics");
  revalidatePath(`/listing/${requestRecord.listing.id}`);
  redirect("/sell?contactUpdated=1");
}

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const listingCategoryId = sp.listingCategory;
  const error = sp.error;
  const paid = sp.paid === "1";
  const free = sp.free === "1";
  const requested = sp.requested === "1";
  const contactUpdated = sp.contactUpdated === "1";
  const dbUnavailableError =
    "Database is temporarily unreachable. Please retry in a moment.";

  async function fetchSellData() {
    return Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.city.findMany({ orderBy: { name: "asc" } }),
      prisma.listing.findMany({
        where: {
          sellerId: user.id,
          status: ListingStatus.ACTIVE,
          ...(listingCategoryId ? { categoryId: listingCategoryId } : {}),
        },
        orderBy: { updatedAt: "desc" },
        include: {
          category: true,
        },
      }),
      prisma.categoryFieldTemplate.findMany({
        where: { isActive: true, category: { isActive: true } },
        orderBy: [{ categoryId: "asc" }, { order: "asc" }],
      }),
      prisma.listing.count({
        where: { sellerId: user.id, status: ListingStatus.ACTIVE },
      }),
      (async () => {
        try {
          return await prisma.categoryRequest.findMany({
            where: { requesterId: user.id },
            orderBy: { createdAt: "desc" },
            take: 5,
          });
        } catch (error) {
          if (isMissingCategoryRequestTableError(error)) return [];
          throw error;
        }
      })(),
      prisma.contactRequest.findMany({
        where: { sellerUserId: user.id },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 12,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
          requester: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);
  }

  let sellData: Awaited<ReturnType<typeof fetchSellData>> | null = null;
  try {
    if (!shouldSkipPrismaCalls()) {
      sellData = await fetchSellData();
      markPrismaHealthy();
    }
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      sellData = null;
    } else {
      throw error;
    }
  }

  if (!sellData) {
    return (
      <div className="space-y-6">
        <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black sm:text-5xl">
              Seller Dashboard
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Publish faster with category-specific fields, GPT support, and
              clear pricing plans.
            </p>
          </div>
        </section>

        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-5 text-sm text-foreground">
            {dbUnavailableError}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link href="/sell">
            <Button variant="outline">Retry</Button>
          </Link>
          <Link href="/browse">
            <Button>Go to browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  const [
    categories,
    cities,
    listings,
    templates,
    activeCount,
    recentCategoryRequests,
    contactRequests,
  ] = sellData;

  const templatesByCategory = groupTemplatesByCategory(
    normalizeTemplates(templates),
  );
  const initialCategoryId =
    sp.categoryId &&
    categories.some((category) => category.id === sp.categoryId)
      ? sp.categoryId
      : undefined;
  const selectedListingCategory =
    listingCategoryId &&
    categories.find((category) => category.id === listingCategoryId);
  const activeWithFilterHref = `/sell${listingCategoryId ? `?listingCategory=${listingCategoryId}` : ""}`;
  const recentRequestItems = recentCategoryRequests.map((request) => ({
    id: request.id,
    desiredName: request.desiredName,
    status: request.status,
    createdAtLabel: new Date(request.createdAt).toLocaleDateString(),
  }));
  const pendingContactCount = contactRequests.filter(
    (request) => request.status === "PENDING",
  ).length;

  return (
    <div className="space-y-7">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-4xl font-black sm:text-5xl">
              Seller Dashboard
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Publish faster with category-specific fields, GPT support, and
              clear pricing plans.
            </p>
          </div>
          <Link href="/sell/analytics">
            <Button variant="outline" className="gap-2">
              <BarChart3 size={16} />
              Open analytics
            </Button>
          </Link>
        </div>
      </section>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}
      {paid && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Dummy Stripe payment completed. Listing is now active.
          </CardContent>
        </Card>
      )}
      {free && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Your first 30-day listing is active for free.
          </CardContent>
        </Card>
      )}
      {requested && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Category request submitted. Admin will review it soon.
          </CardContent>
        </Card>
      )}
      {contactUpdated && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Contact request updated and buyer notification email sent.
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="sticky top-[72px] z-30 rounded-2xl border border-border/75 bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:top-[76px] sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={activeWithFilterHref}>
                <Button variant="default">
                  <Megaphone size={14} className="mr-1" />
                  Active ({activeCount})
                </Button>
              </Link>
              {pendingContactCount > 0 && (
                <Badge variant="warning">
                  Phone requests: {pendingContactCount}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <OpenAssistantButton />
              <CreateListingPopout
                action={createListing}
                categories={categories}
                cities={cities}
                templatesByCategory={templatesByCategory}
                initial={{ categoryId: initialCategoryId }}
                mode="button"
                buttonLabel="Create now"
                buttonSize="sm"
                allowDraft={false}
                publishLabel="Publish 30-day listing"
                paymentProvider="stripe-dummy"
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-2 py-1">
              <span className="relative h-5 w-5 overflow-hidden rounded-full border border-primary/35">
                <span className="absolute inset-0 bg-[conic-gradient(from_0deg,_#ff6a00_0deg,_#ff6a00_42deg,_#0d6efd_42deg,_#0d6efd_84deg,_#fff_84deg,_#fff_126deg,_#ff6a00_126deg,_#ff6a00_168deg,_#0d6efd_168deg,_#0d6efd_210deg,_#fff_210deg,_#fff_252deg,_#ff6a00_252deg,_#ff6a00_294deg,_#0d6efd_294deg,_#0d6efd_336deg,_#fff_336deg,_#fff_360deg)]" />
                <span className="absolute inset-[5px] rounded-full bg-background" />
              </span>
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <Bot size={13} className="text-secondary" />
                GPT priority + first 30-day post is free
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedListingCategory && (
                <>
                  <Badge variant="secondary">
                    Category: {selectedListingCategory.name}
                  </Badge>
                  <Link
                    href="/sell"
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Clear filter
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <Card className="border-secondary/20">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Goods storage and links</p>
                <p className="text-sm text-muted-foreground">
                  Goods data is stored in marketplace database records and photos
                  are stored in secure cloud storage. Your create and category
                  request forms auto-save locally on this device. Active
                  listings are public, while phone is only shown after your
                  approval.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/browse">
                  <Button variant="outline" size="sm">
                    Public browse
                  </Button>
                </Link>
                <Link href="/sell/analytics">
                  <Button size="sm">Open seller analytics</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="phone-requests" className="border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Phone access requests</CardTitle>
            <p className="text-sm text-muted-foreground">
              Buyers must send a reason before seeing your phone number.
              Approve only trusted requests.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {contactRequests.length === 0 ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                No phone access requests yet.
              </div>
            ) : (
              <div className="space-y-3">
                {contactRequests.map((request) => {
                  const requesterIdentity =
                    request.requester.name || request.requester.email;

                  return (
                    <div
                      key={request.id}
                      className="space-y-2 rounded-xl border border-border/75 bg-card p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <Link
                            href={`/listing/${request.listing.id}`}
                            className="line-clamp-1 text-sm font-semibold hover:underline"
                          >
                            {request.listing.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            Requester: {requesterIdentity}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Received {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={contactBadgeVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </div>

                      <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground/90">
                        {request.message}
                      </div>

                      {request.status === "PENDING" ? (
                        <form action={respondToContactRequest} className="space-y-2">
                          <input type="hidden" name="requestId" value={request.id} />
                          <label className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground">
                              Optional seller note
                            </span>
                            <textarea
                              name="sellerResponse"
                              maxLength={MAX_CONTACT_RESPONSE_LENGTH}
                              className="min-h-20 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
                              placeholder="Example: I can share my number after we confirm delivery area."
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button type="submit" name="decision" value="APPROVED">
                              Approve and reveal phone
                            </Button>
                            <Button
                              type="submit"
                              variant="outline"
                              name="decision"
                              value="REJECTED"
                            >
                              Reject request
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                          <p className="text-muted-foreground">
                            {request.status === "APPROVED"
                              ? "Approved"
                              : "Rejected"}{" "}
                            on {new Date(request.updatedAt).toLocaleDateString()}
                          </p>
                          {request.sellerResponse && (
                            <p className="mt-1 text-muted-foreground">
                              Response: {request.sellerResponse}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {selectedListingCategory
                ? `No active listings in ${selectedListingCategory.name} yet.`
                : "No active listings yet."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="border-border/75">
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="line-clamp-2 text-lg font-bold">
                      {listing.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {listing.category.name} | updated{" "}
                      {new Date(listing.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        listing.status === ListingStatus.ACTIVE
                          ? "success"
                          : "secondary"
                      }
                    >
                      {listing.status}
                    </Badge>
                    {listing.activeUntil && (
                      <Badge variant="warning">
                        Ends{" "}
                        {new Date(listing.activeUntil).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/sell/${listing.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Edit3 size={14} className="mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/listing/${listing.id}`} className="flex-1">
                      <Button variant="ghost" className="w-full">
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card id="category-request">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CirclePlus size={18} className="text-primary" />
            Request a new category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryRequestForm
            action={requestCategory}
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
            }))}
            recentRequests={recentRequestItems}
          />
        </CardContent>
      </Card>
    </div>
  );
}
