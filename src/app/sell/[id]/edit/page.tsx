import { notFound, redirect } from "next/navigation";
import { ListingStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListingForm } from "@/components/listing-form";
import {
  getDynamicFieldEntries,
  groupTemplatesByCategory,
  normalizeTemplates,
  statusFromIntent,
  validatePublishInputs,
} from "@/lib/listing-fields";

async function updateListing(formData: FormData) {
  "use server";

  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const intent = String(formData.get("intent") || "draft");
  const status = statusFromIntent(intent);

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.sellerId !== user.id) return;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const cityId = String(formData.get("cityId") || "");
  const condition = formData.get("condition") as Prisma.ListingUncheckedCreateInput["condition"];
  const price = Number(formData.get("price") || 0);
  const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;

  const templates = await prisma.categoryFieldTemplate.findMany({
    where: { categoryId, isActive: true },
    orderBy: { order: "asc" },
  });
  const dynamicValues = getDynamicFieldEntries(formData);

  if (status === ListingStatus.ACTIVE) {
    const validation = validatePublishInputs({ title, priceCents, templates, dynamicValues });
    if (!validation.isValid) {
      redirect(`/sell/${id}/edit?error=${encodeURIComponent(validation.errors[0])}`);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.listing.update({
      where: { id },
      data: { title, description, priceCents, categoryId, cityId, condition, status },
    });

    await tx.listingFieldValue.deleteMany({ where: { listingId: id } });

    const entries = Object.entries(dynamicValues).filter(([, value]) => value.trim().length > 0);
    if (entries.length > 0) {
      await tx.listingFieldValue.createMany({
        data: entries.map(([key, value]) => ({ listingId: id, key, value })),
      });
    }
  });

  revalidatePath("/browse");
  revalidatePath("/sell");
  revalidatePath(`/listing/${id}`);
  redirect("/sell");
}

async function deleteListing(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  await prisma.listing.deleteMany({ where: { id, sellerId: user.id, status: ListingStatus.DRAFT } });
  revalidatePath("/sell");
  redirect("/sell");
}

export default async function EditListing({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;

  const [listing, categories, cities, templates, fieldValues] = await Promise.all([
    prisma.listing.findUnique({ where: { id }, include: { images: true } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.categoryFieldTemplate.findMany({ where: { isActive: true }, orderBy: [{ categoryId: "asc" }, { order: "asc" }] }),
    prisma.listingFieldValue.findMany({ where: { listingId: id } }),
  ]);
  if (!listing || listing.sellerId !== user.id) notFound();

  const templatesByCategory = groupTemplatesByCategory(normalizeTemplates(templates));
  const dynamicValues = Object.fromEntries(fieldValues.map((value) => [value.key, value.value]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit listing</h1>
      {sp.error && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">{sp.error}</p>}
      <Card>
        <CardContent className="space-y-2">
          <ListingForm
            action={updateListing}
            categories={categories}
            cities={cities}
            templatesByCategory={templatesByCategory}
            initial={{
              id: listing.id,
              title: listing.title,
              description: listing.description,
              price: listing.priceCents / 100,
              condition: listing.condition,
              categoryId: listing.categoryId,
              cityId: listing.cityId,
              dynamicValues,
            }}
          />
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
        <Button variant="destructive" type="submit">Delete draft</Button>
      </form>
    </div>
  );
}
