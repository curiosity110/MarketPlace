import Image from "next/image";
import Link from "next/link";
import { Currency, ListingStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateListingPopout } from "@/components/create-listing-popout";
import { createListingFromAnalytics } from "@/lib/actions/create-listing";
import { requireSeller } from "@/lib/auth";
import { formatCurrencyFromCents } from "@/lib/currency";
import {
  groupTemplatesByCategory,
  normalizeTemplates,
} from "@/lib/listing-fields";
import { parseStoredPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type ListingView = "all" | "active" | "draft";
type ListingPlan = "pay-per-listing" | "subscription";

function parseView(value: string | undefined): ListingView {
  if (value === "active" || value === "draft") return value;
  return "all";
}

function parsePlan(value: string | undefined): ListingPlan | undefined {
  if (value === "pay-per-listing" || value === "subscription") return value;
  return undefined;
}

export default async function SellerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireSeller();
  if (user.role === Role.ADMIN) {
    redirect("/admin");
  }

  const now = new Date();
  const sp = await searchParams;
  const error = sp.error;
  const draftSaved = sp.draft === "1";
  const freeActivated = sp.free === "1";
  const paidActivated = sp.paid === "1";
  const createRequested = sp.create === "1";
  const selectedView = parseView(sp.view);
  const selectedPlan = parsePlan(sp.plan);
  const dbUnavailableError =
    "Database is temporarily unreachable. Please retry in a moment.";

  async function fetchAnalyticsData() {
    return Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, phone: true },
      }),
      prisma.listing.findMany({
        where: { sellerId: user.id },
        include: { category: true, city: true, images: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.city.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.categoryFieldTemplate.findMany({
        where: { isActive: true, category: { isActive: true } },
        orderBy: [{ categoryId: "asc" }, { order: "asc" }],
      }),
      prisma.listing.count({
        where: {
          sellerId: user.id,
          status: { not: ListingStatus.DRAFT },
        },
      }),
    ]);
  }

  let analyticsData: Awaited<ReturnType<typeof fetchAnalyticsData>> | null =
    null;
  try {
    if (!shouldSkipPrismaCalls()) {
      analyticsData = await fetchAnalyticsData();
      markPrismaHealthy();
    }
  } catch (dbError) {
    if (isPrismaConnectionError(dbError)) {
      markPrismaUnavailable();
      analyticsData = null;
    } else {
      throw dbError;
    }
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
          <h1 className="text-4xl font-black">Seller Dashboard</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Category-first dashboard with quick create controls.
          </p>
        </section>

        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-5 text-sm text-foreground">
            {error || dbUnavailableError}
          </CardContent>
        </Card>
      </div>
    );
  }

  const [
    userRecord,
    allListings,
    categories,
    cities,
    templates,
    publishedCount,
  ] = analyticsData;

  const parsedPhone = parseStoredPhone(userRecord?.phone);
  const templatesByCategory = groupTemplatesByCategory(
    normalizeTemplates(templates),
  );
  const hasPublishedListing = publishedCount > 0;

  const activeListings = allListings.filter(
    (listing) => listing.status === ListingStatus.ACTIVE,
  );
  const draftCount = allListings.filter(
    (listing) => listing.status === ListingStatus.DRAFT,
  ).length;
  const expiringSoon = activeListings.filter((listing) => {
    if (!listing.activeUntil) return false;
    const diffMs = listing.activeUntil.getTime() - now.getTime();
    return diffMs > 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const categoryStats = [...allListings]
    .reduce<
      Map<string, { id: string; name: string; posted: number; active: number }>
    >((acc, listing) => {
      const key = listing.category.id;
      const current = acc.get(key) || {
        id: listing.category.id,
        name: listing.category.name,
        posted: 0,
        active: 0,
      };
      current.posted += 1;
      if (listing.status === ListingStatus.ACTIVE) current.active += 1;
      acc.set(key, current);
      return acc;
    }, new Map())
    .values();

  const userCategories = [...categoryStats].sort((a, b) => b.posted - a.posted);
  const selectedCategoryFromQuery = sp.cat;
  const selectedCategory =
    (selectedCategoryFromQuery
      ? userCategories.find(
          (category) => category.id === selectedCategoryFromQuery,
        )
      : null) ||
    userCategories[0] ||
    null;

  const selectedCategoryListings = selectedCategory
    ? [...allListings]
        .filter((listing) => listing.categoryId === selectedCategory.id)
        .filter((listing) => {
          if (selectedView === "active")
            return listing.status === ListingStatus.ACTIVE;
          if (selectedView === "draft")
            return listing.status === ListingStatus.DRAFT;
          return true;
        })
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    : [];

  const categoryBaseHref = selectedCategory
    ? `/sell/analytics?cat=${selectedCategory.id}`
    : "/sell/analytics";

  async function publishDraftFromDashboard(formData: FormData) {
    "use server";

    const sessionUser = await requireSeller();
    if (shouldSkipPrismaCalls()) {
      redirect(
        "/sell/analytics?error=Database%20is%20temporarily%20unreachable",
      );
    }

    const listingId = String(formData.get("id") || "");
    if (!listingId) {
      redirect("/sell/analytics?error=Invalid%20listing.");
    }

    try {
      const [draftListing, profile] = await Promise.all([
        prisma.listing.findUnique({
          where: { id: listingId },
          select: {
            id: true,
            sellerId: true,
            status: true,
            title: true,
            priceCents: true,
            categoryId: true,
            cityId: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: sessionUser.id },
          select: { phone: true },
        }),
      ]);

      if (
        !draftListing ||
        draftListing.sellerId !== sessionUser.id ||
        draftListing.status !== ListingStatus.DRAFT
      ) {
        redirect("/sell/analytics?error=Draft%20listing%20not%20found.");
      }

      if (!profile?.phone?.trim()) {
        redirect(
          `/sell/${listingId}/edit?error=Phone%20number%20is%20required%20to%20publish.`,
        );
      }

      if (!draftListing.title.trim()) {
        redirect(
          `/sell/${listingId}/edit?error=Title%20is%20required%20to%20publish.`,
        );
      }
      if (draftListing.priceCents <= 0) {
        redirect(
          `/sell/${listingId}/edit?error=Price%20must%20be%20greater%20than%200.`,
        );
      }
      if (!draftListing.categoryId) {
        redirect(
          `/sell/${listingId}/edit?error=Category%20is%20required%20to%20publish.`,
        );
      }
      if (!draftListing.cityId) {
        redirect(
          `/sell/${listingId}/edit?error=City%20is%20required%20to%20publish.`,
        );
      }

      const [priorPublishedPosts, categoryExists, cityExists] =
        await Promise.all([
          prisma.listing.count({
            where: {
              sellerId: sessionUser.id,
              id: { not: listingId },
              status: { not: ListingStatus.DRAFT },
            },
          }),
          prisma.category.count({
            where: { id: draftListing.categoryId, isActive: true },
          }),
          prisma.city.count({
            where: { id: draftListing.cityId },
          }),
        ]);

      if (priorPublishedPosts > 0) {
        redirect(
          `/sell/${listingId}/edit?error=Dummy%20Stripe%20payment%20is%20required%20before%20activation.`,
        );
      }

      if (categoryExists === 0) {
        redirect(
          `/sell/${listingId}/edit?error=Selected%20category%20is%20invalid.`,
        );
      }
      if (cityExists === 0) {
        redirect(
          `/sell/${listingId}/edit?error=Selected%20city%20is%20invalid.`,
        );
      }

      await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ListingStatus.ACTIVE,
          activeUntil: new Date(Date.now() + THIRTY_DAYS_MS),
        },
      });

      markPrismaHealthy();
    } catch (dbError) {
      if (isPrismaConnectionError(dbError)) {
        markPrismaUnavailable();
        redirect(
          "/sell/analytics?error=Database%20is%20temporarily%20unreachable",
        );
      }
      throw dbError;
    }

    revalidatePath("/browse");
    revalidatePath("/sell");
    revalidatePath("/sell/analytics");
    revalidatePath(`/listing/${listingId}`);
    redirect("/sell/analytics?free=1");
  }

  return (
    <div className="space-y-6">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">Seller Dashboard</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Full category control with compact listing management.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/profile">
              <Button variant="outline">Profile</Button>
            </Link>
            {categories.length > 0 && cities.length > 0 ? (
              <CreateListingPopout
                mode="button"
                buttonLabel="Create now"
                action={createListingFromAnalytics}
                categories={categories}
                cities={cities}
                templatesByCategory={templatesByCategory}
                allowDraft={false}
                showPlanSelector={hasPublishedListing}
                publishLabel={
                  hasPublishedListing
                    ? "Pay dummy Stripe & publish"
                    : "Publish first 30-day listing (free)"
                }
                paymentProvider={hasPublishedListing ? "stripe-dummy" : "none"}
                openOnMount={createRequested}
                initial={{
                  categoryId: selectedCategory?.id || categories[0]?.id,
                  phone: parsedPhone.localPhone,
                  phoneCountry: parsedPhone.countryCode,
                  currency: Currency.MKD,
                  plan: selectedPlan,
                }}
              />
            ) : (
              <Button disabled>Create now</Button>
            )}
          </div>
        </div>
      </section>

      {error && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">
            {error}
          </CardContent>
        </Card>
      )}
      {draftSaved && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Draft saved. Continue from category controls.
          </CardContent>
        </Card>
      )}
      {freeActivated && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Listing published. Your first 30-day post is free.
          </CardContent>
        </Card>
      )}
      {paidActivated && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Dummy Stripe payment approved. Listing is now active.
          </CardContent>
        </Card>
      )}

      <Card className="border-secondary/20">
        <CardHeader className="pb-2">
          <CardTitle>My categories</CardTitle>
          <p className="text-sm text-muted-foreground">
            One place to switch category, filter by status, edit, and view.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {userCategories.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              No category activity yet.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="flex flex-wrap gap-2">
                  {userCategories.slice(0, 14).map((category) => {
                    const isSelected = selectedCategory?.id === category.id;
                    return (
                      <Link
                        key={category.id}
                        href={`/sell/analytics?cat=${category.id}&view=${selectedView}`}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isSelected
                            ? "border-primary/45 bg-primary/10 text-primary"
                            : "border-border/80 bg-card text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {category.name} ({category.posted})
                      </Link>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      key: "total",
                      label: "Total",
                      value: allListings.length,
                      className: "border-border/70 text-foreground",
                    },
                    {
                      key: "active",
                      label: "Active",
                      value: activeListings.length,
                      className: "border-success/35 text-success",
                    },
                    {
                      key: "drafts",
                      label: "Drafts",
                      value: draftCount,
                      className: "border-border/70 text-foreground",
                    },
                    {
                      key: "soon",
                      label: "Soon",
                      value: expiringSoon,
                      className: "border-warning/35 text-warning",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.key}
                      className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border bg-card ${stat.className}`}
                      title={`${stat.label}: ${stat.value}`}
                    >
                      <span className="text-[10px] font-semibold uppercase leading-none text-muted-foreground">
                        {stat.label}
                      </span>
                      <span className="mt-1 text-sm font-black leading-none">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCategory && (
                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {selectedCategory.name} listings
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`${categoryBaseHref}&view=all`}>
                        <Button
                          size="sm"
                          variant={
                            selectedView === "all" ? "default" : "outline"
                          }
                        >
                          All ({selectedCategory.posted})
                        </Button>
                      </Link>
                      <Link href={`${categoryBaseHref}&view=active`}>
                        <Button
                          size="sm"
                          variant={
                            selectedView === "active" ? "default" : "outline"
                          }
                        >
                          Active ({selectedCategory.active})
                        </Button>
                      </Link>
                      <Link href={`${categoryBaseHref}&view=draft`}>
                        <Button
                          size="sm"
                          variant={
                            selectedView === "draft" ? "default" : "outline"
                          }
                        >
                          Draft ({Math.max(0, selectedCategory.posted - selectedCategory.active)})
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {selectedCategoryListings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No listings in this category for this filter.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedCategoryListings.map((listing) => {
                        const heroImage = listing.images[0]?.url;
                        const isActive =
                          listing.status === ListingStatus.ACTIVE;
                        const statusTone = isActive
                          ? "border-success/35 text-success ring-success/25"
                          : "border-warning/35 text-warning ring-warning/25";

                        return (
                          <article
                            key={listing.id}
                            className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-transform hover:-translate-y-0.5"
                          >
                            <div className="relative h-32">
                              {heroImage ? (
                                <Image
                                  src={heroImage}
                                  alt={listing.title}
                                  fill
                                  unoptimized
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />

                              <div
                                className={`absolute right-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-full border bg-background/90 ring-2 ${statusTone}`}
                              >
                                <span className="text-[9px] font-semibold uppercase leading-none text-muted-foreground">
                                  status
                                </span>
                                <span className="mt-1 text-[11px] font-black leading-none">
                                  {isActive ? "ACTIVE" : "DRAFT"}
                                </span>
                              </div>

                              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                                <p className="line-clamp-1 text-base font-black">
                                  {listing.title}
                                </p>
                                <p className="line-clamp-1 text-xs text-white/85">
                                  Updated{" "}
                                  {new Date(
                                    listing.updatedAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3 p-3">
                              <p className="text-lg font-black text-primary">
                                {formatCurrencyFromCents(
                                  listing.priceCents,
                                  listing.currency,
                                )}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-border/70 bg-muted/20 px-2 py-0.5 text-xs font-semibold">
                                  {listing.status}
                                </span>
                                {listing.activeUntil && (
                                  <span className="rounded-full border border-warning/35 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                                    Ends{" "}
                                    {new Date(
                                      listing.activeUntil,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              {isActive ? (
                                <div className="grid grid-cols-2 gap-2">
                                  <Link href={`/sell/${listing.id}/edit`}>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                    >
                                      Edit
                                    </Button>
                                  </Link>
                                  <Link href={`/listing/${listing.id}`}>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="w-full"
                                    >
                                      View
                                    </Button>
                                  </Link>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {hasPublishedListing ? (
                                    <>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Link href={`/sell/${listing.id}/edit`}>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                          >
                                            Edit
                                          </Button>
                                        </Link>
                                        <Link href={`/sell/${listing.id}/edit`}>
                                          <Button
                                            size="sm"
                                            type="button"
                                            className="w-full"
                                          >
                                            Pay & publish
                                          </Button>
                                        </Link>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Open edit to complete payment popup and publish.
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Link href={`/sell/${listing.id}/edit`}>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                          >
                                            Edit
                                          </Button>
                                        </Link>
                                        <form action={publishDraftFromDashboard}>
                                          <input
                                            type="hidden"
                                            name="id"
                                            value={listing.id}
                                          />
                                          <Button
                                            size="sm"
                                            type="submit"
                                            className="w-full"
                                          >
                                            Publish free
                                          </Button>
                                        </form>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        First 30-day publish is free.
                                      </p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
