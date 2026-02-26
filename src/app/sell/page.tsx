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
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold">Sell Dashboard</h1>
        <p className="text-lg text-muted-foreground">Create and manage your listings with ease</p>
      </div>

      {/* Create Listing Card */}
      <Card className="border-2 bg-gradient-to-br from-card to-card/50">
        <CardContent className="pt-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">📝 Create New Listing</h2>
            <p className="text-muted-foreground text-sm">
              AI will help you write compelling descriptions and set optimal prices
            </p>
          </div>
          
          {error && (
            <div className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}
          
          <ListingForm action={createListing} categories={categories} cities={cities} templatesByCategory={templatesByCategory} />
        </CardContent>
      </Card>

      {/* Listings Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-border">
          <Link href="/sell?tab=draft">
            <Button variant={tab === "draft" ? "default" : "ghost"} className="border-b-2 border-transparent">
              📋 {listings.filter(l => l.status === ListingStatus.DRAFT).length} Drafts
            </Button>
          </Link>
          <Link href="/sell?tab=active">
            <Button variant={tab === "active" ? "default" : "ghost"} className="border-b-2 border-transparent">
              ✅ {listings.filter(l => l.status === ListingStatus.ACTIVE).length} Active
            </Button>
          </Link>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No {tab} listings yet.</p>
              <p className="text-sm text-muted-foreground">
                {tab === "draft" ? "Start creating your first listing above!" : "Publish a draft to see it here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg line-clamp-2">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(listing.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={listing.status === ListingStatus.ACTIVE ? "primary" : "secondary"}>
                      {listing.status === ListingStatus.ACTIVE ? "🟢 Active" : "📋 Draft"}
                    </Badge>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/sell/${listing.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full" type="button">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/listing/${listing.id}`} className="flex-1">
                      <Button variant="ghost" className="w-full" type="button">
                        View
                      </Button>
                    </Link>
                    {listing.status === ListingStatus.DRAFT && (
                      <form action={deleteDraft} className="flex-1">
                        <input type="hidden" name="id" value={listing.id} />
                        <Button variant="destructive" className="w-full" type="submit">
                          Delete
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
