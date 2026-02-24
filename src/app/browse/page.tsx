import Link from "next/link";
import { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/listing-card";

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

  const minRaw = sp.min ? Number(sp.min) : undefined;
  const maxRaw = sp.max ? Number(sp.max) : undefined;

  const minCents =
    minRaw !== undefined && Number.isFinite(minRaw) && minRaw >= 0 ? Math.floor(minRaw * 100) : undefined;

  const maxCents =
    maxRaw !== undefined && Number.isFinite(maxRaw) && maxRaw >= 0 ? Math.floor(maxRaw * 100) : undefined;

  const priceCents: Prisma.IntFilter = {
    ...(minCents !== undefined ? { gte: minCents } : {}),
    ...(maxCents !== undefined ? { lte: maxCents } : {}),
  };

  const where: Prisma.ListingWhereInput = {
    status: ListingStatus.ACTIVE,
    activeUntil: { gt: new Date() },
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(city ? { cityId: city } : {}),
    ...(condition ? { condition: condition as never } : {}),
    ...(Object.keys(priceCents).length ? { priceCents } : {}),
  };

  const [listings, categories, cities] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { city: true, category: true, images: true },
      orderBy:
        sort === "price-asc"
          ? { priceCents: "asc" }
          : sort === "price-desc"
            ? { priceCents: "desc" }
            : { createdAt: "desc" },
    }),
    prisma.category.findMany({ where: { isActive: true } }),
    prisma.city.findMany(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Browse listings</h1>
        <Link href="/browse" className="text-sm text-muted-foreground hover:underline">Clear filters</Link>
      </div>

      <Card>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-6">
            <Input name="q" defaultValue={search} placeholder="Search" className="md:col-span-2" />
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
            <Select name="sort" defaultValue={sort}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </Select>
            <Button variant="outline" type="submit">Apply</Button>
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
    </div>
  );
}
