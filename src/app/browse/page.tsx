import Link from "next/link";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import {
  CategoryFieldType,
  type ListingCondition as ListingConditionType,
  ListingCondition,
  ListingStatus,
  Prisma,
} from "@prisma/client";
import { SlidersHorizontal } from "lucide-react";
import { MobileFilterSheet } from "@/components/browse/mobile-filter-sheet";
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
type CarMakeOption = {
  id: string;
  name: string;
  slug: string;
  models: {
    id: string;
    name: string;
    slug: string;
    makeId: string;
  }[];
};
type ActiveFilterChip = {
  key: string;
  label: string;
  href: string;
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

function parseOptionalYearParam(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}$/.test(trimmed)) return undefined;
  const year = Number(trimmed);
  const currentYear = new Date().getFullYear() + 1;
  if (!Number.isFinite(year) || year < 1950 || year > currentYear) return undefined;
  return year;
}

function isCarsSlug(slug: string | undefined) {
  if (!slug) return false;
  const normalized = slug.toLowerCase();
  return normalized === "cars" || normalized.includes("car");
}

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
        removeFilter: "Remove filter",
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
  const makeSlugParam = (getParam(sp, "make") || "").trim().toLowerCase();
  const modelSlugParam = (getParam(sp, "model") || "").trim().toLowerCase();
  const yearFromParam = getParam(sp, "yearFrom");
  const yearToParam = getParam(sp, "yearTo");

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
  let isCarsCategorySelected = false;

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

  try {
    if (!shouldSkipPrismaCalls()) {
      [parentCategories, cities, carMakes] = await Promise.all([
        getCachedBrowseParentCategories(),
        getCachedBrowseCities(),
        getCachedCarMakesWithModels(),
      ]);

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
            hasYearSwap));

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

      <div className="md:hidden">
        <MobileFilterSheet
          locale={locale}
          categories={categoryOptions}
          cities={cities}
          carMakes={carMakes}
        />
      </div>

      <Card className="hidden border-primary/15 bg-card/90 md:block">
        <CardContent className="p-4 sm:p-5">
          <BrowseFilters
            categories={categoryOptions}
            cities={cities}
            templatesByCategory={templatesByCategory}
            carMakes={carMakes}
            locale={locale}
            canUseFavoritesFilter={Boolean(sessionUser)}
            showActiveChips={false}
          />
        </CardContent>
      </Card>

      {activeFilterChips.length > 0 && (
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterChips.map((chip) => (
              <Link
                key={chip.key}
                href={chip.href}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/35 hover:text-primary"
                aria-label={`${text.removeFilter}: ${chip.label}`}
              >
                <span className="truncate">{chip.label}</span>
                <span aria-hidden>×</span>
              </Link>
            ))}
            <Link
              href="/browse"
              className="ml-auto inline-flex items-center rounded-full px-2 text-xs font-semibold text-primary hover:underline"
            >
              {text.clearAll}
            </Link>
          </div>
        </div>
      )}

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
