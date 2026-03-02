import Image from "next/image";
import Link from "next/link";
import { Currency, ListingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateListingPopout } from "@/components/create-listing-popout";
import { createListingFromDashboard } from "@/lib/actions/create-listing";
import { canAccessControl, requireSeller } from "@/lib/auth";
import { localizeCategoryName } from "@/lib/category-label";
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
import { getServerLocale } from "@/lib/i18n";

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

export async function DashboardPageContent({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        dbUnavailable: "Базата е привремено недостапна. Обиди се повторно наскоро.",
        sellerDashboard: "Контролна табла за продавач",
        dashboardSubtitle: "Целосна контрола по категории со компактен менаџмент.",
        profile: "Профил",
        createNow: "Креирај сега",
        draftSaved: "Нацртот е зачуван. Продолжи од контролата на категории.",
        firstFree: "Огласот е објавен. Првите 30 дена се бесплатни.",
        paymentApproved: "Dummy Stripe плаќањето е одобрено. Огласот е активен.",
        adminTools: "Админ алатки",
        adminToolsDesc:
          "Модерација и контрола за STAFF, ADMIN и CEO.",
        moderation: "Модерација",
        categoryApprovals: "Одобрување категории",
        revenueAnalytics: "Аналитика за приходи",
        usersActions: "Корисници и акции",
        myCategories: "Мои категории",
        myCategoriesDesc:
          "Едно место за категорија, статус, уредување и преглед.",
        noCategoryActivity: "Сè уште нема активност по категории.",
        total: "Вкупно",
        active: "Активни",
        drafts: "Нацрти",
        soon: "Наскоро",
        listings: "огласи",
        all: "Сите",
        draft: "Нацрт",
        noListingsForFilter: "Нема огласи за овој филтер.",
        status: "статус",
        updated: "Ажурирано",
        ends: "Истекува",
        edit: "Уреди",
        view: "Преглед",
        payAndPublish: "Плати и објави",
        openEditHint: "Отвори уредување за плаќање и објава.",
        publishFree: "Објави бесплатно",
        firstPublishFreeHint: "Првото објавување за 30 дена е бесплатно.",
      }
    : {
        dbUnavailable: "Database is temporarily unreachable. Please retry in a moment.",
        sellerDashboard: "Seller Dashboard",
        dashboardSubtitle: "Full category control with compact listing management.",
        profile: "Profile",
        createNow: "Create now",
        draftSaved: "Draft saved. Continue from category controls.",
        firstFree: "Listing published. Your first 30-day post is free.",
        paymentApproved: "Dummy Stripe payment approved. Listing is now active.",
        adminTools: "Admin tools",
        adminToolsDesc:
          "Moderation and marketplace control for STAFF, ADMIN, and CEO.",
        moderation: "Moderation",
        categoryApprovals: "Category approvals",
        revenueAnalytics: "Revenue analytics",
        usersActions: "Users and actions",
        myCategories: "My categories",
        myCategoriesDesc:
          "One place to switch category, filter by status, edit, and view.",
        noCategoryActivity: "No category activity yet.",
        total: "Total",
        active: "Active",
        drafts: "Drafts",
        soon: "Soon",
        listings: "listings",
        all: "All",
        draft: "Draft",
        noListingsForFilter: "No listings in this category for this filter.",
        status: "status",
        updated: "Updated",
        ends: "Ends",
        edit: "Edit",
        view: "View",
        payAndPublish: "Pay & publish",
        openEditHint: "Open edit to complete payment popup and publish.",
        publishFree: "Publish free",
        firstPublishFreeHint: "First 30-day publish is free.",
      };
  const user = await requireSeller();
  const showAdminTools = canAccessControl(user.role);

  const now = new Date();
  const sp = searchParams;
  const error = sp.error;
  const draftSaved = sp.draft === "1";
  const freeActivated = sp.free === "1";
  const paidActivated = sp.paid === "1";
  const createRequested = sp.create === "1";
  const selectedView = parseView(sp.view);
  const selectedPlan = parsePlan(sp.plan);
  const dbUnavailableError = text.dbUnavailable;

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
          <h1 className="text-4xl font-black">{text.sellerDashboard}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {text.dashboardSubtitle}
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
        name: localizeCategoryName(listing.category, locale),
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
    ? `/dashboard?cat=${selectedCategory.id}`
    : "/dashboard";

  async function publishDraftFromDashboard(formData: FormData) {
    "use server";

    const sessionUser = await requireSeller();
    if (shouldSkipPrismaCalls()) {
      redirect(
        "/dashboard?error=Database%20is%20temporarily%20unreachable",
      );
    }

    const listingId = String(formData.get("id") || "");
    if (!listingId) {
      redirect("/dashboard?error=Invalid%20listing.");
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
        redirect("/dashboard?error=Draft%20listing%20not%20found.");
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
          "/dashboard?error=Database%20is%20temporarily%20unreachable",
        );
      }
      throw dbError;
    }

    revalidatePath("/browse");
    revalidatePath("/sell");
    revalidatePath("/dashboard");
    revalidatePath(`/listing/${listingId}`);
    redirect("/dashboard?free=1");
  }

  return (
    <div className="space-y-6">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">{text.sellerDashboard}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {text.dashboardSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/profile">
              <Button variant="outline">{text.profile}</Button>
            </Link>
            {categories.length > 0 && cities.length > 0 ? (
              <CreateListingPopout
                mode="button"
                buttonLabel={text.createNow}
                action={createListingFromDashboard}
                categories={categories}
                cities={cities}
                templatesByCategory={templatesByCategory}
                allowDraft={false}
                showPlanSelector={hasPublishedListing}
                publishLabel={
                  hasPublishedListing
                    ? isMk
                      ? "Плати dummy Stripe и објави"
                      : "Pay dummy Stripe & publish"
                    : isMk
                      ? "Објави прв 30-дневен оглас (бесплатно)"
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
                locale={locale}
              />
            ) : (
              <Button disabled>{text.createNow}</Button>
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
            {text.draftSaved}
          </CardContent>
        </Card>
      )}
      {freeActivated && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            {text.firstFree}
          </CardContent>
        </Card>
      )}
      {paidActivated && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            {text.paymentApproved}
          </CardContent>
        </Card>
      )}

      {showAdminTools && (
        <Card className="border-blue-200/70 bg-blue-50/40 dark:border-blue-700/40 dark:bg-blue-950/10">
          <CardHeader className="pb-2">
            <CardTitle>{text.adminTools}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {text.adminToolsDesc}
            </p>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Link href="/admin" className="block">
              <Button variant="outline" className="w-full justify-start">
                {text.moderation}
              </Button>
            </Link>
            <Link href="/admin/categories" className="block">
              <Button variant="outline" className="w-full justify-start">
                {text.categoryApprovals}
              </Button>
            </Link>
            <Link href="/admin/subscriptions" className="block">
              <Button variant="outline" className="w-full justify-start">
                {text.revenueAnalytics}
              </Button>
            </Link>
            <Link href="/admin" className="block">
              <Button variant="outline" className="w-full justify-start">
                {text.usersActions}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="border-secondary/20">
        <CardHeader className="pb-2">
          <CardTitle>{text.myCategories}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {text.myCategoriesDesc}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {userCategories.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              {text.noCategoryActivity}
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
                        href={`/dashboard?cat=${category.id}&view=${selectedView}`}
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
                      label: text.total,
                      value: allListings.length,
                      className: "border-border/70 text-foreground",
                    },
                    {
                      key: "active",
                      label: text.active,
                      value: activeListings.length,
                      className: "border-success/35 text-success",
                    },
                    {
                      key: "drafts",
                      label: text.drafts,
                      value: draftCount,
                      className: "border-border/70 text-foreground",
                    },
                    {
                      key: "soon",
                      label: text.soon,
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
                      {selectedCategory.name} {text.listings}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`${categoryBaseHref}&view=all`}>
                        <Button
                          size="sm"
                          variant={
                            selectedView === "all" ? "default" : "outline"
                          }
                        >
                          {text.all} ({selectedCategory.posted})
                        </Button>
                      </Link>
                      <Link href={`${categoryBaseHref}&view=active`}>
                        <Button
                          size="sm"
                          variant={
                            selectedView === "active" ? "default" : "outline"
                          }
                        >
                          {text.active} ({selectedCategory.active})
                        </Button>
                      </Link>
                      <Link href={`${categoryBaseHref}&view=draft`}>
                        <Button
                          size="sm"
                          variant={
                            selectedView === "draft" ? "default" : "outline"
                          }
                        >
                          {text.draft} ({Math.max(0, selectedCategory.posted - selectedCategory.active)})
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {selectedCategoryListings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {text.noListingsForFilter}
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
                                  {text.status}
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
                                  {text.updated}{" "}
                                  {new Date(
                                    listing.updatedAt,
                                  ).toLocaleDateString(isMk ? "mk-MK" : "en-US")}
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
                                    {text.ends}{" "}
                                    {new Date(
                                      listing.activeUntil,
                                    ).toLocaleDateString(isMk ? "mk-MK" : "en-US")}
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
                                      {text.edit}
                                    </Button>
                                  </Link>
                                  <Link href={`/listing/${listing.id}`}>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="w-full"
                                    >
                                      {text.view}
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
                                            {text.edit}
                                          </Button>
                                        </Link>
                                        <Link href={`/sell/${listing.id}/edit`}>
                                          <Button
                                            size="sm"
                                            type="button"
                                            className="w-full"
                                          >
                                            {text.payAndPublish}
                                          </Button>
                                        </Link>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {text.openEditHint}
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
                                            {text.edit}
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
                                            {text.publishFree}
                                          </Button>
                                        </form>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {text.firstPublishFreeHint}
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

