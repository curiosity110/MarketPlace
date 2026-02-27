import Link from "next/link";
import {
  CategoryFieldType,
  ListingCondition,
  ListingStatus,
  Prisma,
} from "@prisma/client";
import { SlidersHorizontal } from "lucide-react";
import { BrowseFilters } from "@/components/browse-filters";
import { ListingCard } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { parseTemplateOptions } from "@/lib/listing-fields";

const PAGE_SIZE = 18;
type BrowseTemplate = {
  key: string;
  label: string;
  type: CategoryFieldType;
  options: string[];
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const search = getParam(sp, "q")?.trim();
  const cat = getParam(sp, "cat");
  const sub = getParam(sp, "sub");
  const city = getParam(sp, "city");
  const condition = getParam(sp, "condition");
  const sort = getParam(sp, "sort") || "newest";
  const page = Math.max(1, Number(getParam(sp, "page") || 1));
  const minRaw = Number(getParam(sp, "min") ?? "");
  const maxRaw = Number(getParam(sp, "max") ?? "");
  const categoryId = sub || cat || undefined;

  const minCents =
    Number.isFinite(minRaw) && minRaw >= 0 ? Math.round(minRaw * 100) : undefined;
  const maxCents =
    Number.isFinite(maxRaw) && maxRaw >= 0 ? Math.round(maxRaw * 100) : undefined;

  const [safeMinCents, safeMaxCents] =
    minCents !== undefined &&
    maxCents !== undefined &&
    minCents > maxCents
      ? [maxCents, minCents]
      : [minCents, maxCents];

  const dynamicFilters = Object.entries(sp)
    .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value] as const)
    .filter(([key, value]) => key.startsWith("df_") && typeof value === "string")
    .map(([key, value]) => ({
      key: key.slice(3),
      value: String(value).trim(),
    }))
    .filter((entry) => entry.value.length > 0);

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
  if (condition) {
    andFilters.push({ condition: condition as ListingCondition });
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
    ...(andFilters.length > 0 ? { AND: andFilters } : {}),
  };

  async function fetchBrowseData() {
    return Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          city: true,
          category: {
            include: {
              parent: true,
              fieldTemplates: {
                where: { isActive: true },
                orderBy: { order: "asc" },
              },
            },
          },
          images: true,
          fieldValues: true,
        },
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
      prisma.city.findMany({ orderBy: { name: "asc" } }),
    ]);
  }

  let listings: Awaited<ReturnType<typeof fetchBrowseData>>[0] = [];
  let totalCount = 0;
  let parentCategories: Awaited<ReturnType<typeof fetchBrowseData>>[2] = [];
  let cities: Awaited<ReturnType<typeof fetchBrowseData>>[3] = [];
  let dbUnavailable = false;

  try {
    if (!shouldSkipPrismaCalls()) {
      [listings, totalCount, parentCategories, cities] = await fetchBrowseData();
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

  const flattenedCategories = [
    ...parentCategories,
    ...parentCategories.flatMap((category) => category.children),
  ];
  const selectedCategory = flattenedCategories.find(
    (category) => category.id === categoryId,
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  const params = new URLSearchParams();
  Object.entries(sp).forEach(([key, value]) => {
    const single = Array.isArray(value) ? value[0] : value;
    if (!single || key === "page") return;
    params.set(key, single);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <SlidersHorizontal size={14} />
            Smart browse
          </p>
          <h1 className="text-3xl font-bold">
            {selectedCategory ? selectedCategory.name : "All listings"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} results
            {dynamicFilters.length > 0 && (
              <span className="ml-2">
                | <Badge variant="secondary">{dynamicFilters.length} extra filters</Badge>
              </span>
            )}
          </p>
        </div>

        <Link href="/browse" className="pt-1">
          <Button variant="outline">Reset filters</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <BrowseFilters
            categories={parentCategories.map((category) => ({
              id: category.id,
              name: category.name,
              children: category.children.map((child) => ({
                id: child.id,
                name: child.name,
              })),
            }))}
            cities={cities}
            templatesByCategory={templatesByCategory}
          />
        </CardContent>
      </Card>

      {dbUnavailable && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">
            Browse data is temporarily unavailable because the database is unreachable.
          </CardContent>
        </Card>
      )}

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="text-muted-foreground">
              No listings match your filters.
            </p>
            <Link href="/sell" className="mt-4 inline-block">
              <Button>Be the first to list this item</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="responsive-grid gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
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
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" type="button" disabled>
                Previous
              </Button>
            )}

            {nextPage ? (
              <Link
                href={`/browse?${new URLSearchParams({
                  ...Object.fromEntries(params),
                  page: String(nextPage),
                }).toString()}`}
              >
                <Button type="button">Next</Button>
              </Link>
            ) : (
              <Button type="button" disabled>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
