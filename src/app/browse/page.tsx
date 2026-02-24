import Link from "next/link";
import { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
      <h1 className="text-2xl font-semibold">Browse listings</h1>
      <form className="grid md:grid-cols-4 gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search"
          className="rounded border p-2"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded border p-2"
        >
          <option value="">Any category</option>
          {categories.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="city" defaultValue={city} className="rounded border p-2">
          <option value="">Any city</option>
          {cities.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="rounded border p-2">
          <option value="newest">Newest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
        </select>
        <button className="rounded border px-3 py-2" type="submit">
          Apply
        </button>
      </form>
      <ul className="grid gap-3">
        {listings.map((listing) => (
          <li key={listing.id} className="rounded border p-3">
            <Link
              className="font-semibold underline"
              href={`/listings/${listing.id}`}
            >
              {listing.title}
            </Link>
            <p>
              {listing.city.name} • {(listing.priceCents / 100).toFixed(2)}{" "}
              {listing.currency}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
