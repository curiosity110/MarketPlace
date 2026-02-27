import Image from "next/image";
import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  Layers3,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function normalizeHandlePart(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return normalized || "seller";
}

async function updateSellerProfile(formData: FormData) {
  "use server";

  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    redirect("/sell/analytics?error=Database%20is%20temporarily%20unreachable");
  }

  const name = String(formData.get("name") || "").trim();
  const phoneRaw = String(formData.get("phone") || "").trim();
  const phone = phoneRaw.length > 0 ? phoneRaw : null;

  if (phone && !/^[0-9+\-() ]{6,24}$/.test(phone)) {
    redirect(
      "/sell/analytics?error=Phone%20must%20be%206-24%20characters%20using%20digits%20and%20+%20-%20(%20).",
    );
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: name || null, phone },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/sell/analytics?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }

  revalidatePath("/sell/analytics");
  revalidatePath("/sell");
  redirect("/sell/analytics?saved=1");
}

export default async function SellerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const now = new Date();
  const sp = await searchParams;
  const selectedCategoryId = sp.cat;
  const error = sp.error;
  const saved = sp.saved === "1";
  const dbUnavailableError = "Database is temporarily unreachable. Please retry in a moment.";

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
      prisma.report.findMany({
        where: {
          status: "OPEN",
          listing: { sellerId: user.id },
        },
        select: { id: true },
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-4xl font-black">Seller Dashboard</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Simple profile + listing overview with category controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/sell">
                <Button variant="outline">Manage listings</Button>
              </Link>
              <Link href="/browse">
                <Button>Browse marketplace</Button>
              </Link>
            </div>
          </div>
        </section>

        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-5 text-sm text-foreground">
            {error || dbUnavailableError}
          </CardContent>
        </Card>
      </div>
    );
  }

  const [userRecord, allListings, openReportsOnListings] = analyticsData;

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
  const selectedCategory = selectedCategoryId
    ? userCategories.find((category) => category.id === selectedCategoryId) || null
    : null;

  const scopedListings = selectedCategory
    ? allListings.filter((listing) => listing.categoryId === selectedCategory.id)
    : allListings;
  const scopedActiveListings = scopedListings.filter(
    (listing) => listing.status === ListingStatus.ACTIVE,
  );
  const scopedDraftCount = scopedListings.filter(
    (listing) => listing.status === ListingStatus.DRAFT,
  ).length;
  const scopedExpiringSoon = scopedActiveListings.filter((listing) => {
    if (!listing.activeUntil) return false;
    const diffMs = listing.activeUntil.getTime() - now.getTime();
    return diffMs > 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const emailPrefix = (userRecord?.email || user.email).split("@")[0] || "seller";
  const handleSeed = userRecord?.name?.trim() || emailPrefix;
  const sellerHandle = `@${normalizeHandlePart(handleSeed)}.${user.id.slice(-4)}`;

  const primaryCityStats = [...scopedListings]
    .reduce<Map<string, { name: string; count: number }>>((acc, listing) => {
      const key = listing.city.id;
      const current = acc.get(key) || { name: listing.city.name, count: 0 };
      current.count += 1;
      acc.set(key, current);
      return acc;
    }, new Map())
    .values();
  const primaryCity = [...primaryCityStats].sort((a, b) => b.count - a.count)[0];

  const totalPhotos = scopedListings.reduce(
    (sum, listing) => sum + listing.images.length,
    0,
  );
  const listingsMissingPhotos = scopedListings.filter(
    (listing) => listing.images.length === 0,
  ).length;

  return (
    <div className="space-y-6">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">Seller Dashboard</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Simple profile + listing overview with category controls.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/sell">
              <Button variant="outline">Manage listings</Button>
            </Link>
            <Link href="/sell?tab=active">
              <Button>Active inventory</Button>
            </Link>
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
      {saved && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Seller profile saved.
          </CardContent>
        </Card>
      )}

      <Card className="border-secondary/20">
        <CardHeader className="pb-2">
          <CardTitle>Category control center</CardTitle>
          <p className="text-sm text-muted-foreground">
            Filter listings and jump directly into your strongest categories.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-2">
              <p className="text-sm font-semibold">My category listings</p>
              <select
                name="cat"
                defaultValue={selectedCategory?.id ?? ""}
                className="h-10 w-full max-w-md rounded-xl border border-border bg-input px-3 text-sm"
              >
                <option value="">All my categories</option>
                {userCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.posted})
                  </option>
                ))}
              </select>
              {userCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {userCategories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/sell/analytics?cat=${category.id}`}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                        selectedCategory?.id === category.id
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/80 bg-muted/20 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      {category.name} ({category.posted})
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button type="submit" variant="outline">
                Apply
              </Button>
              {selectedCategory && (
                <Link href="/sell/analytics">
                  <Button type="button" variant="outline">
                    Reset
                  </Button>
                </Link>
              )}
              <Link
                href={`/sell?tab=active${selectedCategory ? `&listingCategory=${selectedCategory.id}` : ""}`}
              >
                <Button type="button">
                  Open listings
                </Button>
              </Link>
            </div>
          </form>

          {userCategories.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              No category activity yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {userCategories.slice(0, 6).map((category, index) => (
                <div
                  key={category.id}
                  className={`rounded-xl border p-3 text-sm ${
                    selectedCategory?.id === category.id
                      ? "border-primary/35 bg-gradient-to-r from-orange-50/70 to-blue-50/70"
                      : "border-border/70 bg-card"
                  }`}
                >
                  {(() => {
                    const previewListings = allListings
                      .filter((listing) => listing.categoryId === category.id)
                      .slice(0, 3);

                    return (
                      <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {index === 0 ? "Top category" : `#${index + 1} category`}
                      </p>
                      <p className="font-semibold">{category.name}</p>
                    </div>
                    <Link href={`/sell?tab=active&listingCategory=${category.id}`}>
                      <Button size="sm">Manage</Button>
                    </Link>
                  </div>
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {category.active} active of {category.posted} posted
                    </p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-blue-600"
                        style={{
                          width: `${Math.max(
                            8,
                            Math.round((category.active / Math.max(1, category.posted)) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                    <Link
                      href={`/sell/analytics?cat=${category.id}`}
                      className="inline-flex text-xs font-semibold text-primary hover:underline"
                    >
                      Focus this category
                    </Link>
                  </div>
                  <details className="mt-2 rounded-lg border border-border/70 bg-background/60 px-2 py-1">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>Quick peek</span>
                      <span>{previewListings.length} items</span>
                    </summary>
                    <div className="mt-2 space-y-2">
                      {previewListings.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No listings in this category yet.
                        </p>
                      ) : (
                        previewListings.map((listing) => (
                          <Link
                            key={listing.id}
                            href={`/sell/${listing.id}/edit`}
                            className="flex items-center gap-2 rounded-lg border border-border/70 bg-card p-2 transition-colors hover:border-primary/30"
                          >
                            {listing.images[0]?.url ? (
                              <Image
                                src={listing.images[0].url}
                                alt={listing.title}
                                width={36}
                                height={36}
                                unoptimized
                                className="h-9 w-9 rounded-md border border-border/70 object-cover"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-md border border-dashed border-border/70 bg-muted/30" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold">
                                {listing.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {listing.status} | {(listing.priceCents / 100).toFixed(0)} EUR
                              </p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </details>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Your seller profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <UserRound size={16} className="text-primary" />
                Full handle
              </p>
              <p className="mt-1 text-lg font-bold">{sellerHandle}</p>
              <p className="text-xs text-muted-foreground">
                Member since{" "}
                {new Date(userRecord?.createdAt || now).toLocaleDateString()}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">Full name</p>
                <p className="font-semibold">{userRecord?.name?.trim() || "Not set"}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="inline-flex items-center gap-1 font-semibold">
                  <Mail size={13} className="text-secondary" />
                  {userRecord?.email || user.email}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">Phone for approved requests</p>
                <p className="inline-flex items-center gap-1 font-semibold">
                  <Phone size={13} className="text-secondary" />
                  {userRecord?.phone || "Not set"}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">Primary city</p>
                <p className="inline-flex items-center gap-1 font-semibold">
                  <MapPin size={13} className="text-primary" />
                  {primaryCity?.name || "Not enough data"}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">Uploaded photos</p>
                <p className="inline-flex items-center gap-1 font-semibold">
                  <Camera size={13} className="text-secondary" />
                  {totalPhotos}
                </p>
              </div>
            </div>

            <form action={updateSellerProfile} className="space-y-2">
              <label className="text-sm font-medium">Update profile details</label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  name="name"
                  defaultValue={userRecord?.name || ""}
                  placeholder="Enter your full name"
                  className="min-w-[240px]"
                />
                <Input
                  name="phone"
                  defaultValue={userRecord?.phone || ""}
                  placeholder="+389 70 123 456"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This number is only shown when you approve a buyer request.
              </p>
              <Button type="submit">Save profile</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seller actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Continue drafts</p>
                  <p className="text-xs text-muted-foreground">
                    {scopedDraftCount} draft{scopedDraftCount === 1 ? "" : "s"} ready to finish
                  </p>
                </div>
                <Link href={`/sell?tab=draft${selectedCategory ? `&listingCategory=${selectedCategory.id}` : ""}`}>
                  <Button size="sm" variant="outline">
                    Open drafts
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Expiring listings</p>
                  <p className="text-xs text-muted-foreground">
                    {scopedExpiringSoon} active listing{scopedExpiringSoon === 1 ? "" : "s"} expire within 7 days
                  </p>
                </div>
                <Link href={`/sell?tab=active${selectedCategory ? `&listingCategory=${selectedCategory.id}` : ""}`}>
                  <Button size="sm" variant="outline">
                    Renew/manage
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Listings without photos</p>
                  <p className="text-xs text-muted-foreground">
                    {listingsMissingPhotos} listing{listingsMissingPhotos === 1 ? "" : "s"} can be improved with photos
                  </p>
                </div>
                <Link href={`/sell?tab=active${selectedCategory ? `&listingCategory=${selectedCategory.id}` : ""}`}>
                  <Button size="sm">
                    Improve now
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total listings</p>
              <p className="text-3xl font-black">{scopedListings.length}</p>
            </div>
            <Layers3 className="text-secondary" size={22} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active / drafts</p>
              <p className="text-3xl font-black">
                {scopedActiveListings.length}/{scopedDraftCount}
              </p>
            </div>
            <Megaphone className="text-primary" size={22} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expiring soon</p>
              <p className="text-3xl font-black">{scopedExpiringSoon}</p>
            </div>
            <AlertTriangle className="text-warning" size={22} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open reports</p>
              <p className="text-3xl font-black">{openReportsOnListings.length}</p>
            </div>
            <ShieldCheck className="text-success" size={22} />
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
