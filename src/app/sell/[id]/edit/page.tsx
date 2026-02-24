import { notFound, redirect } from "next/navigation";
import { ListingCondition } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
      <h1 className="text-2xl font-semibold">Edit listing</h1>
      <Card>
        <CardContent className="space-y-2">
          <form action={saveListing} className="grid gap-2">
            <input type="hidden" name="id" value={listing.id} />
            <Input name="title" defaultValue={listing.title} required />
            <textarea name="description" defaultValue={listing.description} className="min-h-24 rounded-md border border-border bg-background p-2" required />
            <Input type="number" step="0.01" name="price" defaultValue={listing.priceCents / 100} required />
            <Select name="condition" defaultValue={listing.condition}>{Object.values(ListingCondition).map((c) => <option key={c}>{c}</option>)}</Select>
            <Select name="categoryId" defaultValue={listing.categoryId}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Select name="cityId" defaultValue={listing.cityId}>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <form action="/api/upload" method="post" encType="multipart/form-data" className="space-y-2">
            <input type="hidden" name="listingId" value={listing.id} />
            <Input type="file" name="file" accept="image/*" required />
            <Button variant="outline" type="submit">Upload image</Button>
          </form>
          <ul className="space-y-1 text-sm">
            {listing.images.map((image) => (
              <li key={image.id}><a className="text-muted-foreground underline" href={image.url} target="_blank">{image.url}</a></li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <form action={deleteListing}>
        <input type="hidden" name="id" value={listing.id} />
        <Button variant="destructive" type="submit">Delete listing</Button>
      </form>
    </div>
  );
}
