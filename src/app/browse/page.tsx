import Link from "next/link";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import {
  CategoryFieldType,
  ListingCondition,
  ListingStatus,
  Prisma,
} from "@prisma/client";
import { SlidersHorizontal } from "lucide-react";
import { BrowseFilters } from "@/components/browse-filters";
import { ListingCard } from "@/components/listing-card";
import { SaveSearchPopout } from "@/components/save-search-popout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { localizeCategoryName } from "@/lib/category-label";
import { getServerLocale } from "@/lib/i18n";
import { listingCardSelect } from "@/lib/listing-card-select";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { parseTemplateOptions } from "@/lib/listing-fields";

const PAGE_SIZE = 10;
export const revalidate = 60;
type BrowseSort = "newest" | "price-asc" | "price-desc";
type BrowseTemplate = {
  key: string;
  label: string;
  type: CategoryFieldType;
  options: string[];
};

const getCachedBrowseParentCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        fieldTemplates: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        children: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: {
            fieldTemplates: {
              where: { isActive: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ["browse-parent-categories-v1"],
  { revalidate: 300 },
);

const getCachedBrowseCities = unstable_cache(
  async () => prisma.city.findMany({ orderBy: { name: "asc" } }),
  ["browse-cities-v1"],
  { revalidate: 300 },
);

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseOptionalNumberParam(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSort(value: string | undefined): BrowseSort {
  if (value === "price-asc" || value === "price-desc") return value;
  return "newest";
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getServerLocale();
  const sessionUser = await getSessionUser();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        smartBrowse: "Паметно пребарување",
        allListings: "Сите огласи",
        resultsLine: "резултати | прикажани",
        onThisPage: "на оваа страница",
        extraFilters: "дополнителни филтри",
        showingAll: "Прикажани се сите активни огласи од сите продавачи.",
        resetFilters: "Ресетирај филтри",
        orderBy: "Подреди",
        newest: "Најнови",
        priceAsc: "Цена: ниска кон висока",
        priceDesc: "Цена: висока кон ниска",
        dbUnavailable:
          "Пребарувањето е привремено недостапно поради проблем со базата.",
        noMatch: "Нема огласи што одговараат на твоите филтри.",
        noListingsYet: "\u0421\u0450 \u0443\u0448\u0442\u0435 \u043d\u0435\u043c\u0430 \u043e\u0433\u043b\u0430\u0441\u0438. \u0411\u0438\u0434\u0438 \u043f\u0440\u0432 \u0448\u0442\u043e \u045c\u0435 \u043e\u0431\u0458\u0430\u0432\u0438.",
        firstList: "Биди прв што ќе го објави овој производ",
        popularCategories: "\u041f\u043e\u043f\u0443\u043b\u0430\u0440\u043d\u0438 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438",
        page: "Страница",
        of: "од",
        previous: "Претходна",
        next: "Следна",
        favoritesOnly: "Само омилени",
      }
    : {
        smartBrowse: "Smart browse",
        allListings: "All listings",
        resultsLine: "results | showing",
        onThisPage: "on this page",
        extraFilters: "extra filters",
        showingAll: "Showing all active listings from all sellers.",
        resetFilters: "Reset filters",
        orderBy: "Order by",
        newest: "Newest",
        priceAsc: "Price: low to high",
        priceDesc: "Price: high to low",
        dbUnavailable:
          "Browse data is temporarily unavailable because the database is unreachable.",
        noMatch: "No listings match your filters.",
        noListingsYet: "No listings yet. Be the first to post.",
        firstList: "Be the first to list this item",
        popularCategories: "Popular categories",
        page: "Page",
        of: "of",
        previous: "Previous",
        next: "Next",
        favoritesOnly: "Favorites only",
      };
  const sp = await searchParams;
  const search = getParam(sp, "q")?.trim();
  const cat = getParam(sp, "cat");
  const sub = getParam(sp, "sub");
  const city = getParam(sp, "city");
  const condition = getParam(sp, "condition") || getParam(sp, "cond");
  const favoritesOnlyRequested = getParam(sp, "fav") === "1";
  const sort = parseSort(getParam(sp, "sort"));
  const page = Math.max(1, Number(getParam(sp, "page") || 1));
  const minRaw = parseOptionalNumberParam(getParam(sp, "min"));
  const maxRaw = parseOptionalNumberParam(getParam(sp, "max"));
  const categoryId = sub || cat || undefined;

  const minCents =
    minRaw !== undefined && minRaw >= 0 ? Math.round(minRaw * 100) : undefined;
  const maxCents =
    maxRaw !== undefined && maxRaw >= 0 ? Math.round(maxRaw * 100) : undefined;

  const [safeMinCents, safeMaxCents] =
    minCents !== undefined && maxCents !== undefined && minCents > maxCents
      ? [maxCents, minCents]
      : [minCents, maxCents];

  const dynamicFilters = Object.entries(sp)
    .map(
      ([key, value]) => [key, Array.isArray(value) ? value[0] : value] as const,
    )
    .filter(
      ([key, value]) => key.startsWith("df_") && typeof value === "string",
    )
    .map(([key, value]) => ({
      key: key.slice(3),
      value: String(value).trim(),
    }))
    .filter((entry) => entry.value.length > 0);
  const hasAppliedFilters =
    Boolean(search) ||
    Boolean(cat) ||
    Boolean(sub) ||
    Boolean(city) ||
    Boolean(condition) ||
    (favoritesOnlyRequested && Boolean(sessionUser)) ||
    safeMinCents !== undefined ||
    safeMaxCents !== undefined ||
    dynamicFilters.length > 0;

  const andFilters: Prisma.ListingWhereInput[] = [];

  if (search) {
    andFilters.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (categoryId) {
    andFilters.push({ categoryId });
  }
  if (city) {
    andFilters.push({ cityId: city });
  }
  const conditionValues = new Set(Object.values(ListingCondition));
  const safeCondition =
    condition && conditionValues.has(condition as ListingCondition)
      ? (condition as ListingCondition)
      : undefined;

  if (safeCondition) {
    andFilters.push({ condition: safeCondition });
  }
  if (favoritesOnlyRequested && sessionUser) {
    andFilters.push({
      favorites: {
        some: { userId: sessionUser.id },
      },
    });
  }
  if (safeMinCents !== undefined || safeMaxCents !== undefined) {
    andFilters.push({
      priceCents: {
        ...(safeMinCents !== undefined ? { gte: safeMinCents } : {}),
        ...(safeMaxCents !== undefined ? { lte: safeMaxCents } : {}),
      },
    });
  }

  dynamicFilters.forEach((entry) => {
    andFilters.push({
      fieldValues: {
        some: {
          key: entry.key,
          value: { contains: entry.value, mode: "insensitive" },
        },
      },
    });
  });

  const where: Prisma.ListingWhereInput = {
    status: ListingStatus.ACTIVE,
    sale: null,
    ...(andFilters.length > 0 ? { AND: andFilters } : {}),
  };

  async function fetchBrowseData() {
    return Promise.all([
      prisma.listing.findMany({
        where,
        select: listingCardSelect,
        orderBy:
          sort === "price-asc"
            ? { priceCents: "asc" }
            : sort === "price-desc"
              ? { priceCents: "desc" }
              : { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.listing.count({ where }),
      getCachedBrowseParentCategories(),
      getCachedBrowseCities(),
    ]);
  }

  let listings: Awaited<ReturnType<typeof fetchBrowseData>>[0] = [];
  let totalCount = 0;
  let parentCategories: Awaited<ReturnType<typeof fetchBrowseData>>[2] = [];
  let cities: Awaited<ReturnType<typeof fetchBrowseData>>[3] = [];
  const favoriteListingIdSet = new Set<string>();
  let dbUnavailable = false;

  try {
    if (!shouldSkipPrismaCalls()) {
      [listings, totalCount, parentCategories, cities] =
        await fetchBrowseData();
      if (sessionUser && listings.length > 0) {
        const favoriteRows = await prisma.favorite.findMany({
          where: {
            userId: sessionUser.id,
            listingId: { in: listings.map((listing) => listing.id) },
          },
          select: { listingId: true },
        });
        favoriteRows.forEach((favorite) =>
          favoriteListingIdSet.add(favorite.listingId),
        );
      }
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

  const validParentCategoryIds = new Set(
    parentCategories.map((category) => category.id),
  );
  const validSubcategoryIds = new Set(
    parentCategories.flatMap((category) =>
      category.children.map((child) => child.id),
    ),
  );
  const validCityIds = new Set(cities.map((cityItem) => cityItem.id));
  const validConditionValues = conditionValues;

  const hasInvalidCat = Boolean(cat && !validParentCategoryIds.has(cat));
  const hasInvalidSub = Boolean(sub && !validSubcategoryIds.has(sub));
  const hasInvalidCity = Boolean(city && !validCityIds.has(city));
  const hasInvalidCondition = Boolean(
    condition && !validConditionValues.has(condition as ListingCondition),
  );
  const hasInvalidFav = Boolean(favoritesOnlyRequested && !sessionUser);

  if (
    hasInvalidCat ||
    hasInvalidSub ||
    hasInvalidCity ||
    hasInvalidCondition ||
    hasInvalidFav
  ) {
    const sanitized = new URLSearchParams();
    Object.entries(sp).forEach(([key, value]) => {
      const single = Array.isArray(value) ? value[0] : value;
      if (!single) return;
      if (key === "cat" && hasInvalidCat) return;
      if (key === "sub" && hasInvalidSub) return;
      if (key === "city" && hasInvalidCity) return;
      if ((key === "condition" || key === "cond") && hasInvalidCondition) return;
      if (key === "fav" && hasInvalidFav) return;
      sanitized.set(key, single);
    });

    const query = sanitized.toString();
    redirect(query ? `/browse?${query}` : "/browse");
  }

  const templatesByCategory = parentCategories.reduce<
    Record<string, BrowseTemplate[]>
  >((acc, category) => {
    acc[category.id] = category.fieldTemplates.map((template) => ({
      key: template.key,
      label: template.label,
      type: template.type,
      options: parseTemplateOptions(template),
    }));

    category.children.forEach((child) => {
      acc[child.id] = child.fieldTemplates.map((template) => ({
        key: template.key,
        label: template.label,
        type: template.type,
        options: parseTemplateOptions(template),
      }));
    });

    return acc;
  }, {});

  const flattenedCategories = [
    ...parentCategories,
    ...parentCategories.flatMap((category) => category.children),
  ];
  const selectedCategory = flattenedCategories.find(
    (category) => category.id === categoryId,
  );
  const selectedCategoryLabel = selectedCategory
    ? localizeCategoryName(selectedCategory, locale)
    : null;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  const params = new URLSearchParams();
  Object.entries(sp).forEach(([key, value]) => {
    const single = Array.isArray(value) ? value[0] : value;
    if (!single || key === "page") return;
    params.set(key, single);
  });
  const saveSearchQuery = Object.fromEntries(params.entries());

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <SlidersHorizontal size={14} />
            {text.smartBrowse}
          </p>
          <h1 className="text-3xl font-bold">
            {selectedCategoryLabel || text.allListings}
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} {text.resultsLine} {listings.length} {text.onThisPage}
            {dynamicFilters.length > 0 && (
              <span className="ml-2">
                |{" "}
                <Badge variant="secondary">
                  {dynamicFilters.length} {text.extraFilters}
                </Badge>
              </span>
            )}
          </p>
          {!hasAppliedFilters && (
            <p className="text-xs text-muted-foreground">{text.showingAll}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Boolean(sessionUser) && hasAppliedFilters && (
            <SaveSearchPopout locale={locale} query={saveSearchQuery} />
          )}
          {hasAppliedFilters && (
            <Link href="/browse">
              <Button variant="outline" type="button">
                {text.resetFilters}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="border-primary/15 bg-card/90">
        <CardContent className="p-4 sm:p-5">
          <BrowseFilters
            categories={parentCategories.map((category) => ({
              id: category.id,
              name: localizeCategoryName(category, locale),
              children: category.children.map((child) => ({
                id: child.id,
                name: localizeCategoryName(child, locale),
              })),
            }))}
            cities={cities}
            templatesByCategory={templatesByCategory}
            locale={locale}
            canUseFavoritesFilter={Boolean(sessionUser)}
          />
        </CardContent>
      </Card>

      {dbUnavailable && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">
            {text.dbUnavailable}
          </CardContent>
        </Card>
      )}

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="text-muted-foreground">
              {hasAppliedFilters ? text.noMatch : text.noListingsYet}
            </p>
            <Link href="/dashboard?create=1" className="mt-4 inline-block">
              <Button>{text.firstList}</Button>
            </Link>
            {!hasAppliedFilters && parentCategories.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {text.popularCategories}
                </span>
                {parentCategories.slice(0, 6).map((category) => (
                  <Link key={category.id} href={`/browse?cat=${category.id}`}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      {localizeCategoryName(category, locale)}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
              currentAuthUserId={sessionUser?.authUserId}
              isFavorited={favoriteListingIdSet.has(listing.id)}
            />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <p className="text-sm text-muted-foreground">
            {text.page} {page} {text.of} {totalPages}
          </p>
          <div className="flex gap-2">
            {prevPage ? (
              <Link
                href={`/browse?${new URLSearchParams({
                  ...Object.fromEntries(params),
                  page: String(prevPage),
                }).toString()}`}
              >
                <Button variant="outline" type="button">
                  {text.previous}
                </Button>
              </Link>
            ) : (
              <Button variant="outline" type="button" disabled>
                {text.previous}
              </Button>
            )}

            {nextPage ? (
              <Link
                href={`/browse?${new URLSearchParams({
                  ...Object.fromEntries(params),
                  page: String(nextPage),
                }).toString()}`}
              >
                <Button type="button">{text.next}</Button>
              </Link>
            ) : (
              <Button type="button" disabled>
                {text.next}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
