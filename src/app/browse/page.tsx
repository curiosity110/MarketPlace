import Link from "next/link";
import { ListingCondition, ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/listing-card";

const PAGE_SIZE = 20;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  const search = sp.q?.trim();
  const category = sp.category;
  const city = sp.city;
  const condition = sp.condition;
  const sort = sp.sort || "newest";
  const page = Math.max(1, Number(sp.page || 1));

  const minRaw = sp.min ? Number(sp.min) : undefined;
  const maxRaw = sp.max ? Number(sp.max) : undefined;

  const minCents = minRaw !== undefined && Number.isFinite(minRaw) && minRaw >= 0 ? Math.floor(minRaw * 100) : undefined;
  const maxCents = maxRaw !== undefined && Number.isFinite(maxRaw) && maxRaw >= 0 ? Math.floor(maxRaw * 100) : undefined;

  const priceCents: Prisma.IntFilter = {
    ...(minCents !== undefined ? { gte: minCents } : {}),
    ...(maxCents !== undefined ? { lte: maxCents } : {}),
  };

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
    ...(category ? { categoryId: category } : {}),
    ...(city ? { cityId: city } : {}),
    ...(condition ? { condition: condition as ListingCondition } : {}),
    ...(Object.keys(priceCents).length ? { priceCents } : {}),
  };

  const [listings, totalCount, categories, cities] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        city: true,
        category: { include: { fieldTemplates: { where: { isActive: true }, orderBy: { order: "asc" } } } },
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
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  const params = new URLSearchParams();
  Object.entries(sp).forEach(([key, value]) => {
    if (value && key !== "page") params.set(key, value);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Browse listings</h1>
        <Link href="/browse" className="text-sm text-muted-foreground hover:underline">Clear filters</Link>
      </div>

      <Card>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-8">
            <Input name="q" defaultValue={search} placeholder="Search title or description" className="md:col-span-2" />
            <Select name="category" defaultValue={category}>
              <option value="">Any category</option>
              {categories.map((c) => (
                <option value={c.id} key={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select name="city" defaultValue={city}>
              <option value="">Any city</option>
              {cities.map((c) => (
                <option value={c.id} key={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select name="condition" defaultValue={condition}>
              <option value="">Any condition</option>
              {Object.values(ListingCondition).map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Input type="number" step="0.01" min="0" name="min" defaultValue={sp.min} placeholder="Min price" />
            <Input type="number" step="0.01" min="0" name="max" defaultValue={sp.max} placeholder="Max price" />
            <div className="flex gap-2 md:col-span-2">
              <Select name="sort" defaultValue={sort}>
                <option value="newest">Newest</option>
                <option value="price-asc">Price low → high</option>
                <option value="price-desc">Price high → low</option>
              </Select>
              <Button variant="outline" type="submit">Apply</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {listings.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No listings match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {listings.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border bg-card/70 p-3 text-sm">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          {prevPage ? (
            <Link href={`/browse?${new URLSearchParams({ ...Object.fromEntries(params), page: String(prevPage) }).toString()}`}>
              <Button variant="outline" type="button">Previous</Button>
            </Link>
          ) : (
            <Button variant="outline" type="button" disabled>Previous</Button>
          )}
          {nextPage ? (
            <Link href={`/browse?${new URLSearchParams({ ...Object.fromEntries(params), page: String(nextPage) }).toString()}`}>
              <Button type="button">Next</Button>
            </Link>
          ) : (
            <Button type="button" disabled>Next</Button>
          )}
        </div>
      </div>
    </div>
  );
}
