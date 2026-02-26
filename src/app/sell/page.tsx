import Link from "next/link";
import { ListingStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingForm } from "@/components/listing-form";
import {
  getDynamicFieldEntries,
  groupTemplatesByCategory,
  normalizeTemplates,
  statusFromIntent,
  validatePublishInputs,
} from "@/lib/listing-fields";

async function createListing(formData: FormData) {
  "use server";

  const user = await requireUser();
  const intent = String(formData.get("intent") || "draft");
  const status = statusFromIntent(intent);

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
      redirect(`/sell?error=${encodeURIComponent(validation.errors[0])}`);
    }
  }

  let listingId = "";
  await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.create({
      data: {
        sellerId: user.id,
        title,
        description,
        priceCents,
        categoryId,
        cityId,
        condition,
        status,
      },
    });

    listingId = listing.id;
    const entries = Object.entries(dynamicValues).filter(([, value]) => value.trim().length > 0);
    if (entries.length > 0) {
      await tx.listingFieldValue.createMany({
        data: entries.map(([key, value]) => ({ listingId: listing.id, key, value })),
      });
    }
  });

  revalidatePath("/browse");
  revalidatePath("/sell");
  if (listingId) revalidatePath(`/listing/${listingId}`);
  redirect("/sell");
}

async function deleteDraft(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = String(formData.get("id") || "");

  await prisma.listing.deleteMany({
    where: { id, sellerId: user.id, status: ListingStatus.DRAFT },
  });

  revalidatePath("/sell");
}

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const tab = sp.tab === "active" ? "active" : "draft";
  const error = sp.error;

  const [categories, cities, listings, templates] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.listing.findMany({
      where: { sellerId: user.id, status: tab === "active" ? ListingStatus.ACTIVE : ListingStatus.DRAFT },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.categoryFieldTemplate.findMany({
      where: { isActive: true, category: { isActive: true } },
      orderBy: [{ categoryId: "asc" }, { order: "asc" }],
    }),
  ]);

  const templatesByCategory = groupTemplatesByCategory(normalizeTemplates(templates));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sell dashboard</h1>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-lg font-medium">Create listing</h2>
          {error && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
          <ListingForm action={createListing} categories={categories} cities={cities} templatesByCategory={templatesByCategory} />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link href="/sell?tab=draft"><Button variant={tab === "draft" ? "default" : "outline"}>Drafts</Button></Link>
        <Link href="/sell?tab=active"><Button variant={tab === "active" ? "default" : "outline"}>Active</Button></Link>
      </div>

      <ul className="space-y-2">
        {listings.map((listing) => (
          <li key={listing.id}>
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="space-y-1">
                  <p className="font-medium">{listing.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge>{listing.status}</Badge>
                    <span>Updated {new Date(listing.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/sell/${listing.id}/edit`}><Button variant="outline" type="button">Edit</Button></Link>
                  <Link href={`/listing/${listing.id}`}><Button variant="ghost" type="button">View</Button></Link>
                  {listing.status === ListingStatus.DRAFT && (
                    <form action={deleteDraft}>
                      <input type="hidden" name="id" value={listing.id} />
                      <Button variant="destructive" type="submit">Delete draft</Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
