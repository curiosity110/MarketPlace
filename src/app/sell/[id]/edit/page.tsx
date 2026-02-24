import { notFound, redirect } from "next/navigation";
import { ListingCondition } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

async function saveListing(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = String(formData.get("id"));
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.sellerId !== user.id) return;
  await prisma.listing.update({
    where: { id },
    data: {
      title: String(formData.get("title")),
      description: String(formData.get("description")),
      priceCents: Math.round(Number(formData.get("price")) * 100),
      condition: formData.get("condition") as ListingCondition,
      categoryId: String(formData.get("categoryId")),
      cityId: String(formData.get("cityId")),
    },
  });
  redirect("/sell");
}

async function deleteListing(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = String(formData.get("id"));
  await prisma.listing.deleteMany({ where: { id, sellerId: user.id } });
  redirect("/sell");
}

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [listing, categories, cities] = await Promise.all([
    prisma.listing.findUnique({ where: { id }, include: { images: true } }),
    prisma.category.findMany({ where: { isActive: true } }),
    prisma.city.findMany(),
  ]);
  if (!listing || listing.sellerId !== user.id) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">Edit listing</h1>
      <form action={saveListing} className="grid gap-2">
        <input type="hidden" name="id" value={listing.id} />
        <input name="title" defaultValue={listing.title} className="rounded border p-2" required />
        <textarea name="description" defaultValue={listing.description} className="rounded border p-2" required />
        <input type="number" step="0.01" name="price" defaultValue={listing.priceCents / 100} className="rounded border p-2" required />
        <select name="condition" defaultValue={listing.condition} className="rounded border p-2">{Object.values(ListingCondition).map((c) => <option key={c}>{c}</option>)}</select>
        <select name="categoryId" defaultValue={listing.categoryId} className="rounded border p-2">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="cityId" defaultValue={listing.cityId} className="rounded border p-2">{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <button className="rounded border px-3 py-2" type="submit">Save</button>
      </form>

      <form action="/api/upload" method="post" encType="multipart/form-data" className="space-y-2">
        <input type="hidden" name="listingId" value={listing.id} />
        <input type="file" name="file" accept="image/*" required />
        <button className="rounded border px-3 py-2" type="submit">Upload image</button>
      </form>

      <ul>{listing.images.map((image) => <li key={image.id}><a className="underline" href={image.url} target="_blank">{image.url}</a></li>)}</ul>

      <form action={deleteListing}>
        <input type="hidden" name="id" value={listing.id} />
        <button className="rounded border px-3 py-2" type="submit">Delete listing</button>
      </form>
    </div>
  );
}
