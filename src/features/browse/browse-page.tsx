import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import {
  type ListingCondition as ListingConditionType,
  ListingCondition,
  ListingStatus,
  Prisma,
} from "@prisma/client";
import type {
  ActiveFilterChip,
  BrowseTemplate,
  CarMakeOption,
  ListingSimilarityData,
} from "@/app/browse/browse-page.types";
import {
  buildBrowseBaseParams,
  buildBrowsePageHref,
  getBrowseParam,
  isCarsSlug,
  parseBrowseSort,
  parseOptionalNumberParam,
  parseOptionalYearParam,
} from "@/app/browse/browse-page.utils";
import {
  BrowsePagination,
  BrowseSimilarityBar,
} from "@/components/browse-page";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/ui/layout";
import { BrowseActiveFilters } from "@/features/browse/browse-active-filters";
import { BrowseEmptyState } from "@/features/browse/browse-empty-state";
import { BrowseHeader } from "@/features/browse/browse-header";
import { BrowseResultsGrid } from "@/features/browse/browse-results-grid";
import { BrowseToolbar } from "@/features/browse/browse-toolbar";
import { getBrowsePageText } from "@/features/browse/utils";
import { getSessionUser } from "@/lib/auth";
import {
  BROWSE_SIMILARITY_CLEAR_KEYS,
  patchBrowseParams,
  parseBrowseSimilarityQuery,
} from "@/lib/browse/params";
import {
  CAR_FUEL_FIELD_KEYS,
  CAR_TRANSMISSION_FIELD_KEYS,
} from "@/lib/browse/similarity";
import { localizeCategoryName } from "@/lib/category-label";
import { buildCreateListingHref } from "@/lib/create-listing-href";
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

const getCachedCarMakesWithModels = unstable_cache(
  async () =>
    prisma.carMake.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        models: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            makeId: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ["browse-car-makes-models-v1"],
  { revalidate: 300 },
);

function conditionLabelMap(locale: "en" | "mk"): Record<ListingConditionType, string> {
  if (locale === "mk") {
    return {
      NEW: "Ново",
      USED: "Користено",
      REFURBISHED: "Рефурбиширано",
    };
  }
  return {
    NEW: "New",
    USED: "Used",
    REFURBISHED: "Refurbished",
  };
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Browse container: URL-param driven data orchestration; filters/results are delegated components.
  const locale = await getServerLocale();
  const sessionUser = await getSessionUser();
  const createHref = buildCreateListingHref();
  const isMk = locale === "mk";
  const pageText = getBrowsePageText(locale);
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
        filters: "Филтри",
        apply: "Примени",
        clearAll: "Исчисти сѐ",
        searchChip: "Пребарување",
        categoryChip: "Категорија",
        subcategoryChip: "Поткатегорија",
        cityChip: "Град",
        conditionChip: "Состојба",
        priceChip: "Цена",
        makeChip: "Марка",
        modelChip: "Модел",
        yearChip: "Година",
        make: "Марка",
        model: "Модел",
        yearFrom: "Година од",
        yearTo: "Година до",
        carsFilters: "Филтри за коли",
        activeFilters: "Активни филтри",
        removeFilter: "Отстрани филтер",
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
        filters: "Filters",
        apply: "Apply",
        clearAll: "Clear all",
        searchChip: "Search",
        categoryChip: "Category",
        subcategoryChip: "Subcategory",
        cityChip: "City",
        conditionChip: "Condition",
        priceChip: "Price",
        makeChip: "Make",
        modelChip: "Model",
        yearChip: "Year",
        make: "Make",
        model: "Model",
        yearFrom: "Year from",
        yearTo: "Year to",
        carsFilters: "Cars filters",
        activeFilters: "Active filters",
        removeFilter: "Remove filter",
      };
  const similarityText = isMk
    ? {
        becauseClicked: "Затоа што кликна:",
        unknownListing: "избран оглас",
        clearSimilarity: "Исчисти слично/исклучи",
        similarityFilters: "Слично/исклучи филтри",
        similarityModeChip: "Режим: слични",
        fuelChip: "Гориво",
        transmissionChip: "Менувач",
        excludePrefix: "Исклучи",
      }
    : {
        becauseClicked: "Because you clicked:",
        unknownListing: "selected listing",
        clearSimilarity: "Clear similar/exclude",
        similarityFilters: "Similar/exclude filters",
        similarityModeChip: "Mode: similar",
        fuelChip: "Fuel",
        transmissionChip: "Transmission",
        excludePrefix: "Exclude",
      };
  const sp = await searchParams;
  const similarityQuery = parseBrowseSimilarityQuery(sp);
  const search = getBrowseParam(sp, "q")?.trim();
  const cat = getBrowseParam(sp, "cat");
  const sub = getBrowseParam(sp, "sub");
  const city = getBrowseParam(sp, "city");
  const condition = getBrowseParam(sp, "condition") || getBrowseParam(sp, "cond");
  const favoritesOnlyRequested = getBrowseParam(sp, "fav") === "1";
  const sort = parseBrowseSort(getBrowseParam(sp, "sort"));
  const page = Math.max(1, Number(getBrowseParam(sp, "page") || 1));
  const minRaw = parseOptionalNumberParam(getBrowseParam(sp, "min"));
  const maxRaw = parseOptionalNumberParam(getBrowseParam(sp, "max"));
  const makeSlugParam = (getBrowseParam(sp, "make") || "").trim().toLowerCase();
  const modelSlugParam = (getBrowseParam(sp, "model") || "").trim().toLowerCase();
  const yearFromParam = getBrowseParam(sp, "yearFrom");
  const yearToParam = getBrowseParam(sp, "yearTo");

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

  let listings: Array<Prisma.ListingGetPayload<typeof listingCardSelect>> = [];
  let totalCount = 0;
  let parentCategories: Awaited<ReturnType<typeof getCachedBrowseParentCategories>> = [];
  let cities: Awaited<ReturnType<typeof getCachedBrowseCities>> = [];
  let carMakes: CarMakeOption[] = [];
  const favoriteListingIdSet = new Set<string>();
  const similarityDataByListingId = new Map<string, ListingSimilarityData>();
  let dbUnavailable = false;

  let safeCat = cat || "";
  let safeSub = sub || "";
  let safeCity = city || "";
  let safeCondition: ListingCondition | undefined;
  let safeMakeSlug = "";
  let safeModelSlug = "";
  let safeModelId = "";
  let safeYearFrom: number | undefined;
  let safeYearTo: number | undefined;
  const safeFuel = similarityQuery.fuel || "";
  const safeTransmission = similarityQuery.transmission || "";
  let safeNotMakeSlug = similarityQuery.notMake || "";
  let safeNotModelSlug = similarityQuery.notModel || "";
  let safeNotModelId = "";
  const safeNotFuel = similarityQuery.notFuel || "";
  const safeNotTransmission = similarityQuery.notTransmission || "";
  let safeNotCity = similarityQuery.notCity || "";
  let isCarsCategorySelected = false;
  let seedListingTitle: string | null = null;

  let selectedCategoryLabel: string | null = null;
  let selectedCategoryId = "";
  let hasAppliedFilters = false;
  let hasInvalidCat = false;
  let hasInvalidSub = false;
  let hasInvalidCity = false;
  let hasInvalidCondition = false;
  let hasInvalidFav = false;
  let hasInvalidMake = false;
  let hasInvalidModel = false;
  let hasInvalidYearFrom = false;
  let hasInvalidYearTo = false;
  let hasYearSwap = false;
  let hasCarsParamsOutsideCars = false;
  let hasInvalidNotMake = false;
  let hasInvalidNotModel = false;
  let hasInvalidNotCity = false;

  try {
    if (!shouldSkipPrismaCalls()) {
      const seedListingPromise = similarityQuery.seed
        ? prisma.listing.findUnique({
            where: { id: similarityQuery.seed },
            select: { id: true, title: true },
          })
        : Promise.resolve(null);

      const [nextParentCategories, nextCities, nextCarMakes, seedListing] =
        await Promise.all([
          getCachedBrowseParentCategories(),
          getCachedBrowseCities(),
          getCachedCarMakesWithModels(),
          seedListingPromise,
        ]);
      parentCategories = nextParentCategories;
      cities = nextCities;
      carMakes = nextCarMakes;
      seedListingTitle = seedListing?.title || null;

      const validParentCategoryIds = new Set(
        parentCategories.map((category) => category.id),
      );
      const validSubcategoryIds = new Set(
        parentCategories.flatMap((category) =>
          category.children.map((child) => child.id),
        ),
      );
      const validCityIds = new Set(cities.map((cityItem) => cityItem.id));
      const conditionValues = new Set(Object.values(ListingCondition));

      hasInvalidCat = Boolean(cat && !validParentCategoryIds.has(cat));
      hasInvalidSub = Boolean(sub && !validSubcategoryIds.has(sub));
      hasInvalidCity = Boolean(city && !validCityIds.has(city));
      hasInvalidCondition = Boolean(
        condition && !conditionValues.has(condition as ListingCondition),
      );
      hasInvalidFav = Boolean(favoritesOnlyRequested && !sessionUser);

      safeCat = hasInvalidCat ? "" : safeCat;
      safeSub = hasInvalidSub ? "" : safeSub;
      safeCity = hasInvalidCity ? "" : safeCity;
      safeCondition =
        !hasInvalidCondition && condition
          ? (condition as ListingCondition)
          : undefined;

      selectedCategoryId = safeSub || safeCat;

      const parentByChildId = new Map(
        parentCategories.flatMap((category) =>
          category.children.map((child) => [child.id, category] as const),
        ),
      );
      const categoryById = new Map(
        parentCategories
          .flatMap((category) => [category, ...category.children])
          .map((category) => [category.id, category] as const),
      );
      const selectedCategory = selectedCategoryId
        ? categoryById.get(selectedCategoryId)
        : null;

      selectedCategoryLabel = selectedCategory
        ? localizeCategoryName(selectedCategory, locale)
        : null;

      const carsRootSlug = safeSub
        ? parentByChildId.get(safeSub)?.slug
        : selectedCategory?.slug;
      isCarsCategorySelected = isCarsSlug(carsRootSlug);

      const yearFromParsed = parseOptionalYearParam(yearFromParam);
      const yearToParsed = parseOptionalYearParam(yearToParam);
      hasInvalidYearFrom = Boolean(yearFromParam && yearFromParsed === undefined);
      hasInvalidYearTo = Boolean(yearToParam && yearToParsed === undefined);
      safeYearFrom = yearFromParsed;
      safeYearTo = yearToParsed;

      if (
        safeYearFrom !== undefined &&
        safeYearTo !== undefined &&
        safeYearFrom > safeYearTo
      ) {
        hasYearSwap = true;
        [safeYearFrom, safeYearTo] = [safeYearTo, safeYearFrom];
      }

      const makeBySlug = new Map(carMakes.map((make) => [make.slug, make]));
      const modelsWithMake = carMakes.flatMap((make) =>
        make.models.map((model) => ({
          ...model,
          makeSlug: make.slug,
        })),
      );

      const safeMake = makeSlugParam ? makeBySlug.get(makeSlugParam) : undefined;
      hasInvalidMake = Boolean(makeSlugParam && !safeMake);
      safeMakeSlug = safeMake?.slug || "";

      if (modelSlugParam) {
        const candidates = modelsWithMake.filter(
          (model) =>
            model.slug === modelSlugParam &&
            (!safeMake || model.makeId === safeMake.id),
        );
        if (candidates.length === 1) {
          safeModelSlug = candidates[0].slug;
          safeModelId = candidates[0].id;
        } else {
          hasInvalidModel = true;
        }
      }

      const safeNotMake = safeNotMakeSlug
        ? makeBySlug.get(safeNotMakeSlug)
        : undefined;
      hasInvalidNotMake = Boolean(safeNotMakeSlug && !safeNotMake);
      safeNotMakeSlug = safeNotMake?.slug || "";

      if (safeNotModelSlug) {
        const candidates = modelsWithMake.filter(
          (model) =>
            model.slug === safeNotModelSlug &&
            (!safeNotMake || model.makeId === safeNotMake.id),
        );
        if (candidates.length === 1) {
          safeNotModelSlug = candidates[0].slug;
          safeNotModelId = candidates[0].id;
        } else {
          hasInvalidNotModel = true;
          safeNotModelSlug = "";
        }
      }

      hasInvalidNotCity = Boolean(safeNotCity && !validCityIds.has(safeNotCity));
      safeNotCity = hasInvalidNotCity ? "" : safeNotCity;

      hasCarsParamsOutsideCars = Boolean(
        !isCarsCategorySelected &&
          (makeSlugParam || modelSlugParam || yearFromParam || yearToParam),
      );

      if (!isCarsCategorySelected) {
        safeMakeSlug = "";
        safeModelSlug = "";
        safeYearFrom = undefined;
        safeYearTo = undefined;
      }

      const shouldRedirectForInvalidParams =
        hasInvalidCat ||
        hasInvalidSub ||
        hasInvalidCity ||
        hasInvalidCondition ||
        hasInvalidFav ||
        hasCarsParamsOutsideCars ||
        (isCarsCategorySelected &&
          (hasInvalidMake ||
            hasInvalidModel ||
            hasInvalidYearFrom ||
            hasInvalidYearTo ||
            hasYearSwap)) ||
        hasInvalidNotMake ||
        hasInvalidNotModel ||
        hasInvalidNotCity;

      if (shouldRedirectForInvalidParams) {
        const sanitized = new URLSearchParams();
        Object.entries(sp).forEach(([key, value]) => {
          const single = Array.isArray(value) ? value[0] : value;
          if (!single) return;
          if (key === "cat" && hasInvalidCat) return;
          if (key === "sub" && hasInvalidSub) return;
          if (key === "city" && hasInvalidCity) return;
          if ((key === "condition" || key === "cond") && hasInvalidCondition) return;
          if (key === "fav" && hasInvalidFav) return;
          if (key === "make" && (hasCarsParamsOutsideCars || hasInvalidMake)) return;
          if (key === "model" && (hasCarsParamsOutsideCars || hasInvalidModel)) return;
          if (key === "yearFrom" && (hasCarsParamsOutsideCars || hasInvalidYearFrom)) return;
          if (key === "yearTo" && (hasCarsParamsOutsideCars || hasInvalidYearTo)) return;
          if (key === "notMake" && hasInvalidNotMake) return;
          if (key === "notModel" && hasInvalidNotModel) return;
          if (key === "notCity" && hasInvalidNotCity) return;
          sanitized.set(key, single);
        });

        if (isCarsCategorySelected && hasYearSwap) {
          if (safeYearFrom !== undefined) sanitized.set("yearFrom", String(safeYearFrom));
          if (safeYearTo !== undefined) sanitized.set("yearTo", String(safeYearTo));
        }

        const query = sanitized.toString();
        redirect(query ? `/browse?${query}` : "/browse");
      }

      const andFilters: Prisma.ListingWhereInput[] = [];

      if (search) {
        andFilters.push({
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        });
      }

      if (selectedCategoryId) {
        andFilters.push({ categoryId: selectedCategoryId });
      }
      if (safeCity) {
        andFilters.push({ cityId: safeCity });
      }
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
      if (isCarsCategorySelected) {
        if (safeMakeSlug) {
          const make = makeBySlug.get(safeMakeSlug);
          if (make) andFilters.push({ carMakeId: make.id });
        }
        if (safeModelSlug) {
          if (safeModelId) andFilters.push({ carModelId: safeModelId });
        }
        if (safeYearFrom !== undefined || safeYearTo !== undefined) {
          andFilters.push({
            carYear: {
              ...(safeYearFrom !== undefined ? { gte: safeYearFrom } : {}),
              ...(safeYearTo !== undefined ? { lte: safeYearTo } : {}),
            },
          });
        }
      }

      if (similarityQuery.mode === "similar" && similarityQuery.seed) {
        andFilters.push({ id: { not: similarityQuery.seed } });
      }

      if (safeFuel) {
        andFilters.push({
          OR: CAR_FUEL_FIELD_KEYS.map((key) => ({
            fieldValues: {
              some: {
                key,
                value: { contains: safeFuel, mode: "insensitive" },
              },
            },
          })),
        });
      }

      if (safeTransmission) {
        andFilters.push({
          OR: CAR_TRANSMISSION_FIELD_KEYS.map((key) => ({
            fieldValues: {
              some: {
                key,
                value: { contains: safeTransmission, mode: "insensitive" },
              },
            },
          })),
        });
      }

      if (safeNotMakeSlug) {
        const notMake = makeBySlug.get(safeNotMakeSlug);
        if (notMake) {
          andFilters.push({
            NOT: { carMakeId: notMake.id },
          });
        }
      }

      if (safeNotModelSlug && safeNotModelId) {
        andFilters.push({
          NOT: { carModelId: safeNotModelId },
        });
      }

      if (safeNotCity) {
        andFilters.push({
          NOT: { cityId: safeNotCity },
        });
      }

      if (safeNotFuel) {
        andFilters.push({
          NOT: {
            OR: CAR_FUEL_FIELD_KEYS.map((key) => ({
              fieldValues: {
                some: {
                  key,
                  value: { contains: safeNotFuel, mode: "insensitive" },
                },
              },
            })),
          },
        });
      }

      if (safeNotTransmission) {
        andFilters.push({
          NOT: {
            OR: CAR_TRANSMISSION_FIELD_KEYS.map((key) => ({
              fieldValues: {
                some: {
                  key,
                  value: { contains: safeNotTransmission, mode: "insensitive" },
                },
              },
            })),
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

      [listings, totalCount] = await Promise.all([
        prisma.listing.findMany({
          where,
          ...listingCardSelect,
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
      ]);

      if (listings.length > 0) {
        const similarityRows = await prisma.listing.findMany({
          where: { id: { in: listings.map((listing) => listing.id) } },
          select: {
            id: true,
            city: {
              select: { id: true },
            },
            carMake: {
              select: { slug: true },
            },
            carModel: {
              select: { slug: true },
            },
            carYear: true,
            priceCents: true,
            fieldValues: {
              where: {
                key: {
                  in: [...CAR_FUEL_FIELD_KEYS, ...CAR_TRANSMISSION_FIELD_KEYS],
                },
              },
              select: {
                key: true,
                value: true,
              },
            },
          },
        });
        similarityRows.forEach((row) => {
          similarityDataByListingId.set(row.id, row);
        });
      }

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

      hasAppliedFilters =
        Boolean(search) ||
        Boolean(safeCat) ||
        Boolean(safeSub) ||
        Boolean(safeCity) ||
        Boolean(safeCondition) ||
        (favoritesOnlyRequested && Boolean(sessionUser)) ||
        safeMinCents !== undefined ||
        safeMaxCents !== undefined ||
        Boolean(safeMakeSlug) ||
        Boolean(safeModelSlug) ||
        safeYearFrom !== undefined ||
        safeYearTo !== undefined ||
        Boolean(safeFuel) ||
        Boolean(safeTransmission) ||
        Boolean(safeNotMakeSlug) ||
        Boolean(safeNotModelSlug) ||
        Boolean(safeNotFuel) ||
        Boolean(safeNotTransmission) ||
        Boolean(safeNotCity) ||
        dynamicFilters.length > 0;

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
  const categoryOptions = parentCategories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: localizeCategoryName(category, locale),
    children: category.children.map((child) => ({
      id: child.id,
      slug: child.slug,
      name: localizeCategoryName(child, locale),
    })),
  }));
  const cityLabelById = new Map(
    cities.map((cityItem) => [cityItem.id, cityItem.name] as const),
  );
  const categoryLabelById = new Map([
    ...categoryOptions.map((category) => [category.id, category.name] as const),
    ...categoryOptions.flatMap((category) =>
      category.children.map((child) => [child.id, child.name] as const),
    ),
  ]);
  const makeLabelBySlug = new Map(
    carMakes.map((make) => [make.slug, make.name] as const),
  );
  const modelLabelBySlug = new Map(
    carMakes.flatMap((make) =>
      make.models.map((model) => [model.slug, model.name] as const),
    ),
  );
  const conditionLabels = conditionLabelMap(locale);

  const params = buildBrowseBaseParams(sp);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  const prevHref = prevPage ? buildBrowsePageHref(params, prevPage) : null;
  const nextHref = nextPage ? buildBrowsePageHref(params, nextPage) : null;

  const hrefWithout = (...keys: string[]) => {
    const next = new URLSearchParams(params.toString());
    keys.forEach((key) => next.delete(key));
    const query = next.toString();
    return query ? `/browse?${query}` : "/browse";
  };
  const activeFilterChips: ActiveFilterChip[] = [];

  if (search) {
    activeFilterChips.push({
      key: "q",
      label: `${text.searchChip}: ${search}`,
      href: hrefWithout("q"),
    });
  }
  if (safeCat) {
    activeFilterChips.push({
      key: "cat",
      label: `${text.categoryChip}: ${categoryLabelById.get(safeCat) || safeCat}`,
      href: hrefWithout("cat", "sub", "make", "model", "yearFrom", "yearTo"),
    });
  }
  if (safeSub) {
    activeFilterChips.push({
      key: "sub",
      label: `${text.subcategoryChip}: ${categoryLabelById.get(safeSub) || safeSub}`,
      href: hrefWithout("sub", "make", "model", "yearFrom", "yearTo"),
    });
  }
  if (safeCity) {
    activeFilterChips.push({
      key: "city",
      label: `${text.cityChip}: ${cityLabelById.get(safeCity) || safeCity}`,
      href: hrefWithout("city"),
    });
  }
  if (safeCondition) {
    activeFilterChips.push({
      key: "condition",
      label: `${text.conditionChip}: ${conditionLabels[safeCondition]}`,
      href: hrefWithout("condition", "cond"),
    });
  }
  if (safeMinCents !== undefined || safeMaxCents !== undefined) {
    activeFilterChips.push({
      key: "price",
      label: `${text.priceChip}: ${
        safeMinCents !== undefined ? Math.round(safeMinCents / 100) : "min"
      } - ${
        safeMaxCents !== undefined ? Math.round(safeMaxCents / 100) : "max"
      } MKD`,
      href: hrefWithout("min", "max"),
    });
  }
  if (safeMakeSlug) {
    activeFilterChips.push({
      key: "make",
      label: `${text.makeChip}: ${makeLabelBySlug.get(safeMakeSlug) || safeMakeSlug}`,
      href: hrefWithout("make", "model"),
    });
  }
  if (safeModelSlug) {
    activeFilterChips.push({
      key: "model",
      label: `${text.modelChip}: ${modelLabelBySlug.get(safeModelSlug) || safeModelSlug}`,
      href: hrefWithout("model"),
    });
  }
  if (safeYearFrom !== undefined || safeYearTo !== undefined) {
    const yearLabel =
      safeYearFrom !== undefined && safeYearTo !== undefined
        ? `${safeYearFrom} - ${safeYearTo}`
        : safeYearFrom !== undefined
          ? `${text.yearFrom}: ${safeYearFrom}`
          : `${text.yearTo}: ${safeYearTo}`;
    activeFilterChips.push({
      key: "year",
      label: `${text.yearChip}: ${yearLabel}`,
      href: hrefWithout("yearFrom", "yearTo"),
    });
  }
  if (sort !== "newest") {
    const sortLabel =
      sort === "price-asc"
        ? text.priceAsc
        : sort === "price-desc"
          ? text.priceDesc
          : text.newest;
    activeFilterChips.push({
      key: "sort",
      label: `${text.orderBy}: ${sortLabel}`,
      href: hrefWithout("sort"),
    });
  }

  if (safeFuel) {
    activeFilterChips.push({
      key: "fuel",
      label: `${similarityText.fuelChip}: ${safeFuel}`,
      href: hrefWithout("fuel"),
    });
  }
  if (safeTransmission) {
    activeFilterChips.push({
      key: "transmission",
      label: `${similarityText.transmissionChip}: ${safeTransmission}`,
      href: hrefWithout("transmission"),
    });
  }
  const hasSimilarityExplainBar =
    similarityQuery.mode === "similar" ||
    Boolean(similarityQuery.seed) ||
    Boolean(safeNotMakeSlug) ||
    Boolean(safeNotModelSlug) ||
    Boolean(safeNotFuel) ||
    Boolean(safeNotTransmission) ||
    Boolean(safeNotCity);
  const clearSimilarityHref = patchBrowseParams(params, {
    clear: BROWSE_SIMILARITY_CLEAR_KEYS,
  });
  const similarityChips: ActiveFilterChip[] = [];

  if (similarityQuery.mode === "similar") {
    similarityChips.push({
      key: "mode",
      label: similarityText.similarityModeChip,
      href: patchBrowseParams(params, { clear: ["mode", "seed"] }),
    });
  }
  if (safeMakeSlug) {
    similarityChips.push({
      key: "sim-make",
      label: `${text.makeChip}: ${makeLabelBySlug.get(safeMakeSlug) || safeMakeSlug}`,
      href: patchBrowseParams(params, { clear: ["make", "model"] }),
    });
  }
  if (safeModelSlug) {
    similarityChips.push({
      key: "sim-model",
      label: `${text.modelChip}: ${modelLabelBySlug.get(safeModelSlug) || safeModelSlug}`,
      href: patchBrowseParams(params, { clear: ["model"] }),
    });
  }
  if (safeYearFrom !== undefined || safeYearTo !== undefined) {
    const yearLabel =
      safeYearFrom !== undefined && safeYearTo !== undefined
        ? `${safeYearFrom} - ${safeYearTo}`
        : safeYearFrom !== undefined
          ? `${text.yearFrom}: ${safeYearFrom}`
          : `${text.yearTo}: ${safeYearTo}`;
    similarityChips.push({
      key: "sim-year",
      label: `${text.yearChip}: ${yearLabel}`,
      href: patchBrowseParams(params, { clear: ["yearFrom", "yearTo"] }),
    });
  }
  if (safeMinCents !== undefined || safeMaxCents !== undefined) {
    similarityChips.push({
      key: "sim-price",
      label: `${text.priceChip}: ${
        safeMinCents !== undefined ? Math.round(safeMinCents / 100) : "min"
      } - ${
        safeMaxCents !== undefined ? Math.round(safeMaxCents / 100) : "max"
      } MKD`,
      href: patchBrowseParams(params, { clear: ["min", "max"] }),
    });
  }
  if (safeCity) {
    similarityChips.push({
      key: "sim-city",
      label: `${text.cityChip}: ${cityLabelById.get(safeCity) || safeCity}`,
      href: patchBrowseParams(params, { clear: ["city"] }),
    });
  }
  if (safeFuel) {
    similarityChips.push({
      key: "sim-fuel",
      label: `${similarityText.fuelChip}: ${safeFuel}`,
      href: patchBrowseParams(params, { clear: ["fuel"] }),
    });
  }
  if (safeTransmission) {
    similarityChips.push({
      key: "sim-transmission",
      label: `${similarityText.transmissionChip}: ${safeTransmission}`,
      href: patchBrowseParams(params, { clear: ["transmission"] }),
    });
  }
  if (safeNotMakeSlug) {
    similarityChips.push({
      key: "not-make",
      label: `${similarityText.excludePrefix} ${text.makeChip}: ${makeLabelBySlug.get(safeNotMakeSlug) || safeNotMakeSlug}`,
      href: patchBrowseParams(params, { clear: ["notMake", "notModel"] }),
    });
  }
  if (safeNotModelSlug) {
    similarityChips.push({
      key: "not-model",
      label: `${similarityText.excludePrefix} ${text.modelChip}: ${modelLabelBySlug.get(safeNotModelSlug) || safeNotModelSlug}`,
      href: patchBrowseParams(params, { clear: ["notModel"] }),
    });
  }
  if (safeNotFuel) {
    similarityChips.push({
      key: "not-fuel",
      label: `${similarityText.excludePrefix} ${similarityText.fuelChip}: ${safeNotFuel}`,
      href: patchBrowseParams(params, { clear: ["notFuel"] }),
    });
  }
  if (safeNotTransmission) {
    similarityChips.push({
      key: "not-transmission",
      label: `${similarityText.excludePrefix} ${similarityText.transmissionChip}: ${safeNotTransmission}`,
      href: patchBrowseParams(params, { clear: ["notTransmission"] }),
    });
  }
  if (safeNotCity) {
    similarityChips.push({
      key: "not-city",
      label: `${similarityText.excludePrefix} ${text.cityChip}: ${cityLabelById.get(safeNotCity) || safeNotCity}`,
      href: patchBrowseParams(params, { clear: ["notCity"] }),
    });
  }

  const headerSupport = hasAppliedFilters
    ? locale === "mk"
      ? "Резултатите се ажурираат според тековното пребарување и филтри."
      : "Results update from your current search and filters."
    : pageText.support;

  return (
    <PageShell size="wide" className="space-y-4">
      <BrowseHeader
        title={selectedCategoryLabel || pageText.title}
        totalCount={totalCount}
        resultsLabel={pageText.resultsLabel}
        support={headerSupport}
      />

      <BrowseToolbar
        locale={locale}
        searchLabel={pageText.searchLabel}
        searchPlaceholder={pageText.searchPlaceholder}
        sortLabel={pageText.sortLabel}
        filtersLabel={pageText.filtersLabel}
        categories={categoryOptions}
        cities={cities}
        templatesByCategory={templatesByCategory}
        carMakes={carMakes}
        canUseFavoritesFilter={Boolean(sessionUser)}
        activeFilterCount={activeFilterChips.length}
      />

      <BrowseActiveFilters
        chips={activeFilterChips}
        clearHref="/browse"
        clearLabel={pageText.clearAllLabel}
        removeLabel={pageText.removeFilterLabel}
      />

      <BrowseSimilarityBar
        show={hasSimilarityExplainBar}
        becauseClickedLabel={similarityText.becauseClicked}
        selectedListingLabel={seedListingTitle || similarityText.unknownListing}
        clearSimilarityHref={clearSimilarityHref}
        clearSimilarityLabel={similarityText.clearSimilarity}
        similarityFiltersLabel={similarityText.similarityFilters}
        chips={similarityChips}
        removeFilterLabel={text.removeFilter}
      />

      {dbUnavailable && (
        <Card className="bg-warning/10 ring-1 ring-warning/15">
          <CardContent className="py-4 text-sm text-foreground">
            {text.dbUnavailable}
          </CardContent>
        </Card>
      )}

      {listings.length === 0 ? (
        <BrowseEmptyState
          hasAppliedFilters={hasAppliedFilters}
          noMatchLabel={text.noMatch}
          noListingsYetLabel={text.noListingsYet}
          createHref={createHref}
          firstListLabel={text.firstList}
          showPopularCategories={!hasAppliedFilters && parentCategories.length > 0}
          popularCategoriesLabel={text.popularCategories}
          popularCategories={parentCategories.slice(0, 6).map((category) => ({
            id: category.id,
            name: localizeCategoryName(category, locale),
          }))}
        />
      ) : (
        <BrowseResultsGrid
          listings={listings}
          locale={locale}
          currentAuthUserId={sessionUser?.authUserId}
          favoriteListingIdSet={favoriteListingIdSet}
          browseQuery={params.toString()}
          similarityDataByListingId={similarityDataByListingId}
        />
      )}

        <BrowsePagination
          page={page}
          totalPages={totalPages}
        pageLabel={pageText.page}
        ofLabel={pageText.of}
        previousLabel={pageText.previous}
        nextLabel={pageText.next}
        previousHref={prevHref}
        nextHref={nextHref}
      />
    </PageShell>
  );
}

