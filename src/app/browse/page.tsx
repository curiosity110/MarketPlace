import Link from "next/link";
import { ListingCondition, ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/listing-card";

const PAGE_SIZE = 20;

function getParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
) {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const search = getParam(searchParams, "q")?.trim();
  const cat = getParam(searchParams, "cat"); // parent category id
  const sub = getParam(searchParams, "sub"); // child category id
  const city = getParam(searchParams, "city");
  const condition = getParam(searchParams, "condition");
  const sort = getParam(searchParams, "sort") || "newest";
  const page = Math.max(1, Number(getParam(searchParams, "page") || 1));

  const minRaw = getParam(searchParams, "min")
    ? Number(getParam(searchParams, "min"))
    : undefined;
  const maxRaw = getParam(searchParams, "max")
    ? Number(getParam(searchParams, "max"))
    : undefined;

  const minCents =
    minRaw !== undefined && Number.isFinite(minRaw) && minRaw >= 0
      ? Math.floor(minRaw * 100)
      : undefined;
  const maxCents =
    maxRaw !== undefined && Number.isFinite(maxRaw) && maxRaw >= 0
      ? Math.floor(maxRaw * 100)
      : undefined;

  const priceCents: Prisma.IntFilter = {
    ...(minCents !== undefined ? { gte: minCents } : {}),
    ...(maxCents !== undefined ? { lte: maxCents } : {}),
  };

  // If sub is present, use it. Else if cat is present, use it.
  const categoryId = sub || cat || undefined;

  const where: Prisma.ListingWhereInput = {
    status: ListingStatus.ACTIVE,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(city ? { cityId: city } : {}),
    ...(condition ? { condition: condition as ListingCondition } : {}),
    ...(Object.keys(priceCents).length ? { priceCents } : {}),
  };

  const [listings, totalCount, parentCategories, cities] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        city: true,
        category: { include: { parent: true } },
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
        children: { where: { isActive: true }, orderBy: { name: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  // Keep all params except page for pagination building
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    const v = Array.isArray(value) ? value[0] : value;
    if (v && key !== "page") params.set(key, v);
  });

  const selectedParent = parentCategories.find((c) => c.id === cat);
  const subcategories = selectedParent?.children ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Browse listings</h1>
        <Link
          href="/browse"
          className="text-sm text-muted-foreground hover:underline"
        >
          Clear filters
        </Link>
      </div>

      <Card>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-10">
            <Input
              name="q"
              defaultValue={search}
              placeholder="Search title or description"
              className="md:col-span-2"
            />

            {/* Parent category */}
            <Select name="cat" defaultValue={cat}>
              <option value="">Any category</option>
              {parentCategories.map((c: (typeof parentCategories)[number]) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            {/* Subcategory */}
            <Select name="sub" defaultValue={sub} disabled={!cat}>
              <option value="">
                {cat ? "Any subcategory" : "Select category first"}
              </option>
              {subcategories.map((sc: (typeof subcategories)[number]) => (
                <option value={sc.id} key={sc.id}>
                  {sc.name}
                </option>
              ))}
            </Select>

            <Select name="city" defaultValue={city}>
              <option value="">Any city</option>
              {cities.map((c: (typeof cities)[number]) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select name="condition" defaultValue={condition}>
              <option value="">Any condition</option>
              {Object.values(ListingCondition).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>

            <Input
              type="number"
              step="0.01"
              min="0"
              name="min"
              defaultValue={getParam(searchParams, "min")}
              placeholder="Min €"
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              name="max"
              defaultValue={getParam(searchParams, "max")}
              placeholder="Max €"
            />

            <div className="flex gap-2 md:col-span-2">
              <Select name="sort" defaultValue={sort}>
                <option value="newest">Newest</option>
                <option value="price-asc">Price low → high</option>
                <option value="price-desc">Price high → low</option>
              </Select>
              <Button variant="outline" type="submit">
                Apply
              </Button>
            </div>
          </form>

          {/* IMPORTANT: if parent category changes, reset subcategory
              With pure server form submit, easiest is: user changes cat then hits Apply.
              If you want instant reset, we’ll convert filters to client component next. */}
        </CardContent>
      </Card>

      {listings.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No listings match your filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {listings.map((listing: (typeof listings)[number]) => (
            <li key={listing.id}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border bg-card/70 p-3 text-sm">
        <span>
          Page {page} of {totalPages}
        </span>
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
      </div>
    </div>
  );
}
