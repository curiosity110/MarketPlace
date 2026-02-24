import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingCondition } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function createDraft(formData: FormData) {
  "use server";
  const user = await requireUser();
  const title = String(formData.get("title") || "Untitled");
  const categoryId = String(formData.get("categoryId"));
  const cityId = String(formData.get("cityId"));
  await prisma.listing.create({
    data: {
      sellerId: user.id,
      title,
      description: "",
      priceCents: 0,
      categoryId,
      cityId,
      condition: ListingCondition.USED,
    },
  });
  revalidatePath("/sell");
}

export default async function SellPage() {
  const user = await requireUser();
  const [categories, cities, listings] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.listing.findMany({ where: { sellerId: user.id }, orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your draft listings</h1>
      <form action={createDraft} className="grid gap-2 max-w-lg">
        <input name="title" placeholder="Listing title" className="rounded border p-2" required />
        <select name="categoryId" className="rounded border p-2">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="cityId" className="rounded border p-2">{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <button type="submit" className="rounded border px-3 py-2">Create draft</button>
      </form>
      <ul className="space-y-2">
        {listings.map((listing) => (
          <li key={listing.id} className="rounded border p-3 flex justify-between">
            <span>{listing.title}</span>
            <Link href={`/sell/${listing.id}/edit`} className="underline">Edit</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
