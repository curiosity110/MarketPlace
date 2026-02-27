import Image from "next/image";
import Link from "next/link";
import { Currency, ListingStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateListingPopout } from "@/components/create-listing-popout";
import { createListingFromAnalytics } from "@/lib/actions/create-listing";
import { requireSeller } from "@/lib/auth";
import { formatCurrencyFromCents } from "@/lib/currency";
import { groupTemplatesByCategory, normalizeTemplates } from "@/lib/listing-fields";
import { parseStoredPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

function normalizeHandlePart(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return normalized || "seller";
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
  const createRequested = sp.create === "1";
  const dbUnavailableError =
    "Database is temporarily unreachable. Please retry in a moment.";

  async function fetchAnalyticsData() {
    return Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
      }),
      prisma.listing.findMany({
        where: { sellerId: user.id },
        include: { category: true, city: true, images: true },
        orderBy: { createdAt: "desc" },
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

  let analyticsData: Awaited<ReturnType<typeof fetchAnalyticsData>> | null = null;
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

  const [userRecord, allListings, categories, cities, templates, publishedCount] =
    analyticsData;

  const parsedPhone = parseStoredPhone(userRecord?.phone);
  const templatesByCategory = groupTemplatesByCategory(normalizeTemplates(templates));
  const hasPublishedListing = publishedCount > 0;
  const activeListings = allListings.filter(
    (listing) => listing.status === ListingStatus.ACTIVE,
  );
  const payPerListingActive = activeListings.filter((listing) => listing.activeUntil).length;
  const subscriptionActive = activeListings.filter((listing) => !listing.activeUntil).length;

  const categoryStats = [...allListings]
    .reduce<Map<string, { id: string; name: string; posted: number; active: number }>>(
      (acc, listing) => {
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
      },
      new Map(),
    )
    .values();

  const userCategories = [...categoryStats].sort((a, b) => b.posted - a.posted);
  const selectedCategoryFromQuery = sp.cat;
  const selectedCategory =
    (selectedCategoryFromQuery
      ? userCategories.find((category) => category.id === selectedCategoryFromQuery)
      : null) || userCategories[0] || null;

  const selectedCategoryListings = selectedCategory
    ? [...allListings]
        .filter((listing) => listing.categoryId === selectedCategory.id)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    : [];

  const emailPrefix = (userRecord?.email || user.email).split("@")[0] || "seller";
  const handleSeed = userRecord?.name?.trim() || emailPrefix;
  const sellerHandle = `@${normalizeHandlePart(handleSeed)}.${user.id.slice(-4)}`;

  const cityCountMap = allListings.reduce<Map<string, number>>((acc, listing) => {
    acc.set(listing.city.name, (acc.get(listing.city.name) || 0) + 1);
    return acc;
  }, new Map());
  const primaryCity = [...cityCountMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const totalPhotos = allListings.reduce(
    (sum, listing) => sum + listing.images.length,
    0,
  );

  return (
    <div className="space-y-6">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">Seller Dashboard</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Category control + instant create popup.
            </p>
          </div>
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
              }}
            />
          ) : (
            <Button disabled>Create now</Button>
          )}
        </div>
      </section>

      {error && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">{error}</CardContent>
        </Card>
      )}
      {draftSaved && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Draft saved. Continue from your category cards.
          </CardContent>
        </Card>
      )}

      <Card className="border-secondary/20">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>My categories</CardTitle>
              <p className="text-sm text-muted-foreground">
                Full control of your posted categories and listings.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <details className="group relative">
                <summary className="list-none cursor-pointer rounded-xl border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/30">
                  Profile info
                </summary>
                <div className="absolute right-0 top-10 z-20 w-[min(92vw,360px)] rounded-xl border border-border/80 bg-background p-3 shadow-lg">
                  <p className="text-sm font-semibold">Your seller profile</p>
                  <p className="mt-1 text-sm text-muted-foreground">Full handle</p>
                  <p className="text-base font-bold">{sellerHandle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Member since{" "}
                    {new Date(userRecord?.createdAt || now).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-border/70 bg-muted/20 px-2 py-1">
                      {primaryCity || "No primary city"}
                    </span>
                    <span className="rounded-full border border-border/70 bg-muted/20 px-2 py-1">
                      {totalPhotos} photos
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{userRecord?.email || user.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Public phone for all posts
                  </p>
                  <p className="text-sm font-medium">
                    {parsedPhone.countryCode} {parsedPhone.localPhone || "No phone saved"}
                  </p>
                  <Link href="/profile" className="mt-3 block">
                    <Button size="sm" className="w-full">
                      Open full profile
                    </Button>
                  </Link>
                </div>
              </details>

              <details className="group relative">
                <summary className="list-none cursor-pointer rounded-xl border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/30">
                  Billing options
                </summary>
                <div className="absolute right-0 top-10 z-20 w-[min(92vw,360px)] rounded-xl border border-border/80 bg-background p-3 shadow-lg">
                  <p className="text-sm font-semibold">Billing & publish</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    First listing: free 30 days.
                  </p>
                  <div className="mt-2 grid gap-2">
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs">
                      <p className="font-semibold">Pay per listing</p>
                      <p className="text-muted-foreground">$4 per listing / 30 days</p>
                      <p className="mt-1">Active now: {payPerListingActive}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs">
                      <p className="font-semibold">Subscription</p>
                      <p className="text-muted-foreground">$30 / month unlimited</p>
                      <p className="mt-1">Subscription active: {subscriptionActive}</p>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {userCategories.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              No category activity yet.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {userCategories.slice(0, 14).map((category) => {
                  const isSelected = selectedCategory?.id === category.id;
                  return (
                    <Link
                      key={category.id}
                      href={`/sell/analytics?cat=${category.id}`}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isSelected
                          ? "border-primary/45 bg-primary/10 text-primary"
                          : "border-border/80 bg-muted/20 text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {category.name} ({category.posted})
                    </Link>
                  );
                })}
              </div>

              {selectedCategory && (
                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {selectedCategory.name}: {selectedCategory.active} active /{" "}
                      {selectedCategory.posted} total
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {categories.length > 0 && cities.length > 0 && (
                        <CreateListingPopout
                          mode="button"
                          buttonLabel="Create in category"
                          buttonSize="sm"
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
                          initial={{
                            categoryId: selectedCategory.id,
                            phone: parsedPhone.localPhone,
                            phoneCountry: parsedPhone.countryCode,
                            currency: Currency.MKD,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {selectedCategoryListings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No listings in this category yet.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedCategoryListings.slice(0, 9).map((listing) => {
                        const heroImage = listing.images[0]?.url;
                        const isActive = listing.status === ListingStatus.ACTIVE;

                        return (
                          <article
                            key={listing.id}
                            className="overflow-hidden rounded-xl border border-border/70 bg-card"
                          >
                            <div className="relative h-28">
                              {heroImage ? (
                                <Image
                                  src={heroImage}
                                  alt={listing.title}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                                <p className="line-clamp-1 text-base font-black">
                                  {listing.title}
                                </p>
                                <p className="line-clamp-1 text-xs text-white/85">
                                  Updated{" "}
                                  {new Date(listing.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3 p-3">
                              <p className="text-lg font-black text-primary">
                                {formatCurrencyFromCents(listing.priceCents, listing.currency)}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-border/70 bg-muted/20 px-2 py-0.5 text-xs font-semibold">
                                  {listing.status}
                                </span>
                                {listing.activeUntil && (
                                  <span className="rounded-full border border-warning/35 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                                    Ends {new Date(listing.activeUntil).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <Link href={`/sell/${listing.id}/edit`}>
                                  <Button size="sm" variant="outline" className="w-full">
                                    Edit
                                  </Button>
                                </Link>
                                {isActive ? (
                                  <Link href={`/listing/${listing.id}`}>
                                    <Button size="sm" variant="ghost" className="w-full">
                                      View
                                    </Button>
                                  </Link>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled
                                    className="w-full"
                                  >
                                    View
                                  </Button>
                                )}
                              </div>
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
