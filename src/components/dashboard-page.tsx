import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingCard } from "@/components/listing-card";
import { SavedSearchesList } from "@/components/saved-searches-list";
import { DashboardListingsPanel } from "@/components/dashboard-listings-panel";
import { DashboardStatsBento } from "@/components/dashboard-stats-bento";
import { canAccessControl, canSell, requireSeller, requireUser } from "@/lib/auth";
import { buildCreateListingHref } from "@/lib/create-listing-href";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { listingCardSelect } from "@/lib/listing-card-select";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { getServerLocale } from "@/lib/i18n";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type ListingView = "all" | "active" | "draft" | "expired" | "sold";
type ListingSort = "newest" | "price-asc" | "price-desc";
type ListingLayout = "grid" | "list";

function parseView(value: string | undefined): ListingView {
  if (value === "active" || value === "draft" || value === "expired" || value === "sold") {
    return value;
  }
  return "all";
}

function parseSort(value: string | undefined): ListingSort {
  if (value === "price-asc" || value === "price-desc") return value;
  return "newest";
}

function parseLayout(value: string | undefined): ListingLayout {
  if (value === "list") return "list";
  return "grid";
}

function toSavedSearchHref(queryJson: string) {
  try {
    const parsed = JSON.parse(queryJson) as Record<string, unknown>;
    const params = new URLSearchParams();
    Object.entries(parsed).forEach(([key, value]) => {
      const safeKey = key.trim();
      const safeValue = String(value ?? "").trim();
      if (!safeKey || !safeValue) return;
      params.set(safeKey, safeValue);
    });
    const query = params.toString();
    return query ? `/browse?${query}` : "/browse";
  } catch {
    return "/browse";
  }
}

export async function DashboardPageContent({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const baseText = isMk
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
        favorites: "Омилени",
        favoritesDesc: "Огласи кои ги зачува за подоцна.",
        noFavorites: "Сè уште немаш омилени огласи.",
        savedSearches: "Зачувани пребарувања",
        savedSearchesDesc: "Брзо отвори ги филтрите што ги користиш најчесто.",
        noSavedSearches: "Сè уште немаш зачувани пребарувања.",
        noCategoryActivity: "Сè уште нема активност по категории.",
        total: "Вкупно",
        active: "Активни",
        drafts: "Нацрти",
        expired: "Истечени",
        sold: "Продадени",
        soon: "Наскоро",
        listings: "огласи",
        all: "Сите",
        allCategories: "Сите категории",
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
        publishWithSubscription: "Објави со активна претплата",
        subscriptionPublishHint:
          "Имаш активна претплата, затоа оваа објава не бара дополнително плаќање.",
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
        favorites: "Favorites",
        favoritesDesc: "Listings you saved for later.",
        noFavorites: "You do not have favorite listings yet.",
        savedSearches: "Saved searches",
        savedSearchesDesc: "Quickly open your most-used browse filters.",
        noSavedSearches: "No saved searches yet.",
        noCategoryActivity: "No category activity yet.",
        total: "Total",
        active: "Active",
        drafts: "Drafts",
        expired: "Expired",
        sold: "Sold",
        soon: "Soon",
        listings: "listings",
        all: "All",
        allCategories: "All categories",
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
        publishWithSubscription: "Publish with active subscription",
        subscriptionPublishHint:
          "You have an active subscription, so this publish does not require extra payment.",
      };
  const dashboardUiText = isMk
    ? {
        filtersTitle: "\u0424\u0438\u043b\u0442\u0440\u0438",
        categoriesLabel: "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438",
        statusLabel: "\u0421\u0442\u0430\u0442\u0443\u0441",
        searchLabel: "\u041f\u0440\u0435\u0431\u0430\u0440\u0443\u0432\u0430\u045a\u0435",
        searchPlaceholder: "\u041f\u0440\u0435\u0431\u0430\u0440\u0430\u0458 \u043e\u0433\u043b\u0430\u0441\u0438...",
        clearSearch: "\u0418\u0441\u0447\u0438\u0441\u0442\u0438",
        sortLabel: "\u041f\u043e\u0434\u0440\u0435\u0434\u0438 \u043f\u043e",
        sortNewest: "\u041d\u0430\u0458\u043d\u043e\u0432\u0438",
        sortPriceLowHigh: "\u0426\u0435\u043d\u0430: \u043d\u0438\u0441\u043a\u0430 \u043a\u043e\u043d \u0432\u0438\u0441\u043e\u043a\u0430",
        sortPriceHighLow: "\u0426\u0435\u043d\u0430: \u0432\u0438\u0441\u043e\u043a\u0430 \u043a\u043e\u043d \u043d\u0438\u0441\u043a\u0430",
        viewMode: "\u041f\u0440\u0438\u043a\u0430\u0437",
        gridView: "\u041c\u0440\u0435\u0436\u0430",
        listView: "\u041b\u0438\u0441\u0442\u0430",
        results: "\u0440\u0435\u0437\u0443\u043b\u0442\u0430\u0442\u0438",
        createFirstListing: "\u041a\u0440\u0435\u0438\u0440\u0430\u0458 \u043f\u0440\u0432 \u043e\u0433\u043b\u0430\u0441",
        emptyListingsTitle: "\u041d\u0435\u043c\u0430 \u043e\u0433\u043b\u0430\u0441\u0438 \u0437\u0430 \u043e\u0432\u0438\u0435 \u0444\u0438\u043b\u0442\u0440\u0438",
        emptyListingsHint:
          "\u041f\u0440\u043e\u043c\u0435\u043d\u0438 \u0433\u0438 \u0444\u0438\u043b\u0442\u0440\u0438\u0442\u0435 \u0438\u043b\u0438 \u043a\u0440\u0435\u0438\u0440\u0430\u0458 \u043d\u043e\u0432 \u043e\u0433\u043b\u0430\u0441.",
        totalDesc: "\u0412\u043a\u0443\u043f\u0435\u043d \u0431\u0440\u043e\u0458 \u043e\u0433\u043b\u0430\u0441\u0438",
        activeDesc: "\u0416\u0438\u0432\u0438 \u0438 \u0432\u0438\u0434\u043b\u0438\u0432\u0438 \u043e\u0433\u043b\u0430\u0441\u0438",
        draftDesc: "\u0417\u0430\u0447\u0443\u0432\u0430\u043d\u0438 \u043d\u0435\u043e\u0431\u0458\u0430\u0432\u0435\u043d\u0438 \u043e\u0433\u043b\u0430\u0441\u0438",
        soldDesc: "\u041e\u0437\u043d\u0430\u0447\u0435\u043d\u0438 \u043a\u0430\u043a\u043e \u043f\u0440\u043e\u0434\u0430\u0434\u0435\u043d\u0438",
      }
    : {
        filtersTitle: "Filters",
        categoriesLabel: "Categories",
        statusLabel: "Status",
        searchLabel: "Search",
        searchPlaceholder: "Search listings...",
        clearSearch: "Clear",
        sortLabel: "Sort by",
        sortNewest: "Newest",
        sortPriceLowHigh: "Price: low to high",
        sortPriceHighLow: "Price: high to low",
        viewMode: "View",
        gridView: "Grid",
        listView: "List",
        results: "results",
        createFirstListing: "Create your first listing",
        emptyListingsTitle: "No listings for these filters",
        emptyListingsHint: "Try a different filter or create a new listing.",
        totalDesc: "Total listings in your account",
        activeDesc: "Listings currently visible to buyers",
        draftDesc: "Saved but not yet published",
        soldDesc: "Marked as sold",
      };
  const text = { ...baseText, ...dashboardUiText };
  const user = await requireUser();
  const canCreateListings = canSell(user.role);
  const showAdminTools = canAccessControl(user.role);

  const sp = searchParams;
  const error = sp.error;
  const draftSaved = sp.draft === "1";
  const freeActivated = sp.free === "1";
  const paidActivated = sp.paid === "1";
  const selectedView = parseView(sp.view);
  const selectedSort = parseSort(sp.sort);
  const selectedLayout = parseLayout(sp.layout);
  const searchQuery = (sp.q || "").trim();
  const dbUnavailableError = text.dbUnavailable;

  async function fetchAnalyticsData() {
    return Promise.all([
      prisma.listing.findMany({
        where: { ownerId: user.authUserId },
        include: {
          category: true,
          city: true,
          images: true,
          sale: {
            select: {
              id: true,
              soldAt: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.listing.count({
        where: {
          ownerId: user.authUserId,
          status: { not: ListingStatus.DRAFT },
        },
      }),
      prisma.favorite.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          listing: {
            ...listingCardSelect,
          },
        },
      }),
      prisma.savedSearch.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          queryJson: true,
          createdAt: true,
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
      <div className="mx-auto max-w-7xl space-y-6">
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
    allListings,
    categories,
    publishedCount,
    favorites,
    savedSearches,
  ] = analyticsData;
  const hasPublishedListing = publishedCount > 0;

  const activeListings = allListings.filter(
    (listing) => listing.status === ListingStatus.ACTIVE && !listing.sale,
  );
  const soldListings = allListings.filter((listing) => Boolean(listing.sale));
  const draftCount = allListings.filter(
    (listing) => listing.status === ListingStatus.DRAFT && !listing.sale,
  ).length;
  const hasActiveSubscription = activeListings.some(
    (listing) => listing.activeUntil === null,
  );
  const requiresPaymentForCreate = hasPublishedListing && !hasActiveSubscription;
  const validCategoryIds = new Set(categories.map((category) => category.id));
  const selectedCategoryIdFromQuery =
    sp.cat && sp.cat !== "all" && validCategoryIds.has(sp.cat) ? sp.cat : undefined;
  const favoriteListings = favorites.map((favorite) => favorite.listing);
  const savedSearchItems = savedSearches.map((searchItem) => ({
    id: searchItem.id,
    name: searchItem.name,
    href: toSavedSearchHref(searchItem.queryJson),
    createdAtLabel: searchItem.createdAt.toLocaleDateString(
      isMk ? "mk-MK" : "en-US",
    ),
  }));
  const allListingsForClient = allListings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    status: listing.status,
    priceCents: listing.priceCents,
    currency: listing.currency,
    categoryId: listing.categoryId,
    updatedAt: listing.updatedAt.toISOString(),
    activeUntil: listing.activeUntil ? listing.activeUntil.toISOString() : null,
    category: {
      id: listing.category.id,
      name: listing.category.name,
      slug: listing.category.slug,
    },
    city: {
      id: listing.city.id,
      name: listing.city.name,
    },
    images: listing.images.map((image) => ({ url: image.url })),
    sale: listing.sale?.soldAt
      ? {
          soldAt: listing.sale.soldAt.toISOString(),
        }
      : null,
  }));

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

      const [
        priorPublishedPosts,
        categoryExists,
        cityExists,
        activeSubscriptionCount,
      ] =
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
          prisma.listing.count({
            where: {
              ownerId: sessionUser.authUserId,
              status: ListingStatus.ACTIVE,
              activeUntil: null,
              sale: null,
            },
          }),
        ]);
      const hasSubscriptionAccess = activeSubscriptionCount > 0;

      if (priorPublishedPosts > 0 && !hasSubscriptionAccess) {
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
          activeUntil: hasSubscriptionAccess
            ? null
            : new Date(Date.now() + THIRTY_DAYS_MS),
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
  <div className="min-h-[calc(100vh-72px)] bg-gradient-to-b from-muted/30 via-background to-background">
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">{text.sellerDashboard}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {text.dashboardSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCreateListings && categories.length > 0 ? (
              <Link
                href={buildCreateListingHref({
                  cat: selectedCategoryIdFromQuery,
                })}
              >
                <Button>{text.createNow}</Button>
              </Link>
            ) : (
              <Button disabled>{text.createNow}</Button>
            )}
            <Link href="/profile">
              <Button variant="outline">{text.profile}</Button>
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

      <DashboardStatsBento
        stats={[
          {
            key: "total",
            label: text.total,
            value: allListings.length,
            description: text.totalDesc,
            tone: "default",
          },
          {
            key: "active",
            label: text.active,
            value: activeListings.length,
            description: text.activeDesc,
            tone: "success",
          },
          {
            key: "draft",
            label: text.drafts,
            value: draftCount,
            description: text.draftDesc,
            tone: "warning",
          },
          {
            key: "sold",
            label: text.sold,
            value: soldListings.length,
            description: text.soldDesc,
            tone: "secondary",
          },
        ]}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{text.myCategories}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{text.myCategoriesDesc}</p>
        </div>

        <DashboardListingsPanel
          locale={locale}
          text={text}
          allListings={allListingsForClient}
          initialFilters={{
            cat: selectedCategoryIdFromQuery || "all",
            view: selectedView,
            q: searchQuery,
            sort: selectedSort,
            layout: selectedLayout,
          }}
          requiresPaymentForCreate={requiresPaymentForCreate}
          hasActiveSubscription={hasActiveSubscription}
          publishDraftAction={publishDraftFromDashboard}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{text.favorites}</CardTitle>
            <p className="text-sm text-muted-foreground">{text.favoritesDesc}</p>
          </CardHeader>
          <CardContent>
            {favoriteListings.length === 0 ? (
              <p className="text-sm text-muted-foreground">{text.noFavorites}</p>
            ) : (
              <div className="responsive-grid gap-4">
                {favoriteListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    locale={locale}
                    currentAuthUserId={user.authUserId}
                    isFavorited
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{text.savedSearches}</CardTitle>
            <p className="text-sm text-muted-foreground">{text.savedSearchesDesc}</p>
          </CardHeader>
          <CardContent>
            {savedSearchItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">{text.noSavedSearches}</p>
            ) : (
              <SavedSearchesList locale={locale} items={savedSearchItems} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
    </div>
  );
}
