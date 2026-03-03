import Image from "next/image";
import Link from "next/link";
import { Currency, ListingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateListingPopout } from "@/components/create-listing-popout";
import { createListingFromDashboard } from "@/lib/actions/create-listing";
import { canAccessControl, canSell, requireSeller, requireUser } from "@/lib/auth";
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
import { runListingLifecycleMaintenance } from "@/lib/listing-lifecycle";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type ListingView = "all" | "active" | "draft" | "expired" | "sold";
type ListingPlan = "pay-per-listing" | "subscription";

function parseView(value: string | undefined): ListingView {
  if (value === "active" || value === "draft" || value === "expired" || value === "sold") {
    return value;
  }
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
        expired: "Истечени",
        sold: "Продадени",
        soon: "Наскоро",
        listings: "огласи",
        all: "Сите",
        draft: "Нацрт",
        noListingsForFilter: "Нема огласи за овој филтер.",
        status: "статус",
        statusActive: "Активен",
        statusDraft: "Нацрт",
        statusExpired: "Истечен",
        statusSold: "Продаден",
        updated: "Ажурирано",
        ends: "Истекува",
        soldOn: "Продадено на",
        edit: "Уреди",
        view: "Преглед",
        payAndPublish: "Плати и објави",
        openEditHint: "Отвори уредување за плаќање и објава.",
        expiredHint: "Огласот е истечен. Отвори уредување за повторна објава.",
        soldHint: "Овој оглас е означен како продаден.",
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
        expired: "Expired",
        sold: "Sold",
        soon: "Soon",
        listings: "listings",
        all: "All",
        draft: "Draft",
        noListingsForFilter: "No listings in this category for this filter.",
        status: "status",
        statusActive: "Active",
        statusDraft: "Draft",
        statusExpired: "Expired",
        statusSold: "Sold",
        updated: "Updated",
        ends: "Ends",
        soldOn: "Sold on",
        edit: "Edit",
        view: "View",
        payAndPublish: "Pay & publish",
        openEditHint: "Open edit to complete payment popup and publish.",
        expiredHint: "This listing expired. Open edit to renew and publish again.",
        soldHint: "This listing is marked as sold.",
        publishFree: "Publish free",
        firstPublishFreeHint: "First 30-day publish is free.",
      };
  const user = await requireUser();
  const canCreateListings = canSell(user.role);
  const showAdminTools = canAccessControl(user.role);

  const sp = searchParams;
  const error = sp.error;
  const draftSaved = sp.draft === "1";
  const freeActivated = sp.free === "1";
  const paidActivated = sp.paid === "1";
  const createRequested = sp.create === "1";
  const selectedView = parseView(sp.view);
  const selectedPlan = parsePlan(sp.plan);
  const dbUnavailableError = text.dbUnavailable;

  await runListingLifecycleMaintenance();

  async function fetchAnalyticsData() {
    return Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, phone: true },
      }),
      prisma.listing.findMany({
        where: { ownerId: user.authUserId },
        include: { category: true, city: true, images: true, sale: true },
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
          ownerId: user.authUserId,
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
    (listing) => listing.status === ListingStatus.ACTIVE && !listing.sale,
  );
  const soldListings = allListings.filter((listing) => Boolean(listing.sale));
  const expiredListings = allListings.filter(
    (listing) => listing.status === ListingStatus.INACTIVE && !listing.sale,
  );
  const draftCount = allListings.filter(
    (listing) => listing.status === ListingStatus.DRAFT && !listing.sale,
  ).length;
  const categoryStats = [...allListings]
    .reduce<
      Map<
        string,
        {
          id: string;
          name: string;
          posted: number;
          active: number;
          draft: number;
          expired: number;
          sold: number;
        }
      >
    >((acc, listing) => {
      const key = listing.category.id;
      const current = acc.get(key) || {
        id: listing.category.id,
        name: localizeCategoryName(listing.category, locale),
        posted: 0,
        active: 0,
        draft: 0,
        expired: 0,
        sold: 0,
      };
      current.posted += 1;
      if (listing.sale) {
        current.sold += 1;
      } else if (listing.status === ListingStatus.ACTIVE) {
        current.active += 1;
      } else if (listing.status === ListingStatus.DRAFT) {
        current.draft += 1;
      } else if (listing.status === ListingStatus.INACTIVE) {
        current.expired += 1;
      }
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
          if (selectedView === "sold") return Boolean(listing.sale);
          if (selectedView === "active") {
            return listing.status === ListingStatus.ACTIVE && !listing.sale;
          }
          if (selectedView === "draft") {
            return listing.status === ListingStatus.DRAFT && !listing.sale;
          }
          if (selectedView === "expired") {
            return listing.status === ListingStatus.INACTIVE && !listing.sale;
          }
          return true;
        })
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    : [];

  const categoryBaseHref = selectedCategory
    ? `/dashboard?cat=${selectedCategory.id}`
    : "/dashboard";

  async function publishDraftFromDashboard(formData: FormData) {
    "use server";

    const msg = isMk
      ? {
          dbUnavailable: "Базата е привремено недостапна",
          invalidListing: "Невалиден оглас.",
          draftNotFound: "Нацртот не е пронајден.",
          phoneRequired: "Телефонски број е задолжителен за објава.",
          titleRequired: "Наслов е задолжителен за објава.",
          priceRequired: "Цената мора да биде поголема од 0.",
          categoryRequired: "Категорија е задолжителна за објава.",
          cityRequired: "Град е задолжителен за објава.",
          paymentRequired: "Потребно е Dummy Stripe плаќање пред активација.",
          categoryInvalid: "Избраната категорија е невалидна.",
          cityInvalid: "Избраниот град е невалиден.",
        }
      : {
          dbUnavailable: "Database is temporarily unreachable",
          invalidListing: "Invalid listing.",
          draftNotFound: "Draft listing not found.",
          phoneRequired: "Phone number is required to publish.",
          titleRequired: "Title is required to publish.",
          priceRequired: "Price must be greater than 0.",
          categoryRequired: "Category is required to publish.",
          cityRequired: "City is required to publish.",
          paymentRequired: "Dummy Stripe payment is required before activation.",
          categoryInvalid: "Selected category is invalid.",
          cityInvalid: "Selected city is invalid.",
        };

    const sessionUser = await requireSeller();
    if (shouldSkipPrismaCalls()) {
      redirect(
        `/dashboard?error=${encodeURIComponent(msg.dbUnavailable)}`,
      );
    }

    const listingId = String(formData.get("id") || "");
    if (!listingId) {
      redirect(`/dashboard?error=${encodeURIComponent(msg.invalidListing)}`);
    }

    try {
      const [draftListing, profile] = await Promise.all([
        prisma.listing.findFirst({
          where: { id: listingId, ownerId: sessionUser.authUserId },
          select: {
            id: true,
            ownerId: true,
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
        draftListing.ownerId !== sessionUser.authUserId ||
        draftListing.status !== ListingStatus.DRAFT
      ) {
        redirect(`/dashboard?error=${encodeURIComponent(msg.draftNotFound)}`);
      }

      if (!profile?.phone?.trim()) {
        redirect(
          `/sell/${listingId}/edit?error=${encodeURIComponent(msg.phoneRequired)}`,
        );
      }

      if (!draftListing.title.trim()) {
        redirect(
          `/sell/${listingId}/edit?error=${encodeURIComponent(msg.titleRequired)}`,
        );
      }
      if (draftListing.priceCents <= 0) {
        redirect(
          `/sell/${listingId}/edit?error=${encodeURIComponent(msg.priceRequired)}`,
        );
      }
      if (!draftListing.categoryId) {
        redirect(
          `/sell/${listingId}/edit?error=${encodeURIComponent(msg.categoryRequired)}`,
        );
      }
      if (!draftListing.cityId) {
        redirect(
          `/sell/${listingId}/edit?error=${encodeURIComponent(msg.cityRequired)}`,
        );
      }

      const [priorPublishedPosts, categoryExists, cityExists] =
        await Promise.all([
          prisma.listing.count({
            where: {
              ownerId: sessionUser.authUserId,
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
          `/sell/${listingId}/edit?error=${encodeURIComponent(msg.paymentRequired)}`,
        );
      }

      if (categoryExists === 0) {
        redirect(
          `/sell/${listingId}/edit?error=${encodeURIComponent(msg.categoryInvalid)}`,
        );
      }
      if (cityExists === 0) {
        redirect(
          `/sell/${listingId}/edit?error=${encodeURIComponent(msg.cityInvalid)}`,
        );
      }

      await prisma.listing.updateMany({
        where: { id: listingId, ownerId: sessionUser.authUserId },
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
          `/dashboard?error=${encodeURIComponent(msg.dbUnavailable)}`,
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
            {canCreateListings && categories.length > 0 && cities.length > 0 ? (
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
              <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                <div className="flex flex-wrap gap-2">
                  {userCategories.map((category) => {
                    const isSelected = selectedCategory?.id === category.id;
                    return (
                      <Link
                        key={category.id}
                        href={`/dashboard?cat=${category.id}&view=${selectedView}`}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isSelected
                            ? "border-primary/45 bg-primary/10 text-primary shadow-sm"
                            : "border-border/80 bg-card text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {category.name} ({category.posted})
                      </Link>
                    );
                  })}
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
                      key: "expired",
                      label: text.expired,
                      value: expiredListings.length,
                      className: "border-warning/35 text-warning",
                    },
                    {
                      key: "sold",
                      label: text.sold,
                      value: soldListings.length,
                      className: "border-secondary/35 text-secondary",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.key}
                      className={`rounded-xl border bg-card px-3 py-2 ${stat.className}`}
                      title={`${stat.label}: ${stat.value}`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {stat.label}
                      </span>
                      <span className="mt-1 block text-lg font-black leading-none">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCategory && (
                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-sm font-semibold">
                      {selectedCategory.name} {text.listings}
                    </p>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
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
                          {text.draft} ({selectedCategory.draft})
                        </Button>
                      </Link>
                      <Link href={`${categoryBaseHref}&view=expired`}>
                        <Button
                          size="sm"
                          variant={
                            selectedView === "expired" ? "default" : "outline"
                          }
                        >
                          {text.expired} ({selectedCategory.expired})
                        </Button>
                      </Link>
                      <Link href={`${categoryBaseHref}&view=sold`}>
                        <Button
                          size="sm"
                          variant={
                            selectedView === "sold" ? "default" : "outline"
                          }
                        >
                          {text.sold} ({selectedCategory.sold})
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
                        const isSold = Boolean(listing.sale);
                        const isActive = listing.status === ListingStatus.ACTIVE;
                        const isDraft = listing.status === ListingStatus.DRAFT;
                        const statusLabel = isSold
                          ? text.statusSold
                          : isActive
                          ? text.statusActive
                          : isDraft
                            ? text.statusDraft
                            : text.statusExpired;
                        const statusTone = isSold
                          ? "border-secondary/35 text-secondary ring-secondary/20"
                          : isActive
                          ? "border-success/35 text-success ring-success/25"
                          : isDraft
                            ? "border-warning/35 text-warning ring-warning/25"
                            : "border-destructive/35 text-destructive ring-destructive/20";

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
                                  {statusLabel}
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
                                  {statusLabel}
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

                              {isSold ? (
                                <div className="space-y-2">
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
                                  <p className="text-xs text-muted-foreground">
                                    {text.soldHint}
                                  </p>
                                  {listing.sale?.soldAt && (
                                    <p className="text-xs text-muted-foreground">
                                      {text.soldOn}{" "}
                                      {new Date(listing.sale.soldAt).toLocaleDateString(
                                        isMk ? "mk-MK" : "en-US",
                                      )}
                                    </p>
                                  )}
                                </div>
                              ) : isActive ? (
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
                              ) : isDraft ? (
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
                              ) : (
                                <div className="space-y-2">
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
                                    {text.expiredHint}
                                  </p>
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
