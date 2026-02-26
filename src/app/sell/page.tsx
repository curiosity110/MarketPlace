import Link from "next/link";
import { ListingStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CirclePlus, Edit3, FolderClock, Megaphone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingForm } from "@/components/listing-form";
import {
  getDynamicFieldEntries,
  groupTemplatesByCategory,
  normalizeTemplates,
  statusFromIntent,
  validatePublishInputs,
} from "@/lib/listing-fields";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function resolveActiveUntil(status: ListingStatus, plan: string) {
  if (status !== ListingStatus.ACTIVE) return null;
  if (plan === "subscription") return null;
  return new Date(Date.now() + THIRTY_DAYS_MS);
}

async function createListing(formData: FormData) {
  "use server";

  const user = await requireUser();
  const intent = String(formData.get("intent") || "draft");
  const status = statusFromIntent(intent);
  const plan = String(formData.get("plan") || "pay-per-listing");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const cityId = String(formData.get("cityId") || "");
  const condition = formData.get(
    "condition",
  ) as Prisma.ListingUncheckedCreateInput["condition"];
  const price = Number(formData.get("price") || 0);
  const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;

  const templates = await prisma.categoryFieldTemplate.findMany({
    where: { categoryId, isActive: true },
    orderBy: { order: "asc" },
  });
  const dynamicValues = getDynamicFieldEntries(formData);

  if (status === ListingStatus.ACTIVE) {
    const validation = validatePublishInputs({
      title,
      priceCents,
      templates,
      dynamicValues,
    });
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
        activeUntil: resolveActiveUntil(status, plan),
      },
    });

    listingId = listing.id;
    const entries = Object.entries(dynamicValues).filter(
      ([, value]) => value.trim().length > 0,
    );
    if (entries.length > 0) {
      await tx.listingFieldValue.createMany({
        data: entries.map(([key, value]) => ({
          listingId: listing.id,
          key,
          value,
        })),
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

async function requestCategory(formData: FormData) {
  "use server";
  const user = await requireUser();

  const desiredName = String(formData.get("desiredName") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const parentIdRaw = String(formData.get("parentId") || "").trim();
  const parentId = parentIdRaw || null;

  if (desiredName.length < 3) {
    redirect("/sell?error=Category%20request%20needs%20at%20least%203%20characters.");
  }

  await prisma.categoryRequest.create({
    data: {
      requesterId: user.id,
      desiredName,
      description: description || null,
      parentId,
    },
  });

  revalidatePath("/sell");
  revalidatePath("/admin");
  redirect("/sell?requested=1");
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
  const requested = sp.requested === "1";

  const [
    categories,
    cities,
    listings,
    templates,
    draftCount,
    activeCount,
    recentCategoryRequests,
  ] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.listing.findMany({
      where: {
        sellerId: user.id,
        status: tab === "active" ? ListingStatus.ACTIVE : ListingStatus.DRAFT,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
      },
    }),
    prisma.categoryFieldTemplate.findMany({
      where: { isActive: true, category: { isActive: true } },
      orderBy: [{ categoryId: "asc" }, { order: "asc" }],
    }),
    prisma.listing.count({
      where: { sellerId: user.id, status: ListingStatus.DRAFT },
    }),
    prisma.listing.count({
      where: { sellerId: user.id, status: ListingStatus.ACTIVE },
    }),
    prisma.categoryRequest.findMany({
      where: { requesterId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const templatesByCategory = groupTemplatesByCategory(
    normalizeTemplates(templates),
  );
  const initialCategoryId =
    sp.categoryId && categories.some((category) => category.id === sp.categoryId)
      ? sp.categoryId
      : undefined;

  return (
    <div className="space-y-7">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black sm:text-5xl">Seller Dashboard</h1>
          <p className="max-w-2xl text-muted-foreground">
            Publish faster with category-specific fields, GPT support, and clear
            pricing plans.
          </p>
        </div>
      </section>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}
      {requested && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="py-4 text-sm text-success">
            Category request submitted. Admin will review it soon.
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Create a new listing</CardTitle>
        </CardHeader>
        <CardContent>
          <ListingForm
            action={createListing}
            categories={categories}
            cities={cities}
            templatesByCategory={templatesByCategory}
            initial={{ categoryId: initialCategoryId }}
          />
        </CardContent>
      </Card>

      <Card id="category-request">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CirclePlus size={18} className="text-primary" />
            Request a new category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={requestCategory} className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 md:col-span-1">
              <span className="text-sm font-medium">Category name</span>
              <input
                name="desiredName"
                required
                minLength={3}
                className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm"
                placeholder="Example: Industrial Equipment"
              />
            </label>

            <label className="space-y-1 md:col-span-1">
              <span className="text-sm font-medium">Closest parent category</span>
              <select
                name="parentId"
                defaultValue=""
                className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm"
              >
                <option value="">No parent (top-level)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">Reason / details</span>
              <textarea
                name="description"
                className="min-h-24 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
                placeholder="What should be searchable in this category?"
              />
            </label>

            <Button className="md:col-span-2" type="submit">
              Submit category request
            </Button>
          </form>

          {recentCategoryRequests.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Your latest requests</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {recentCategoryRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm"
                  >
                    <p className="font-semibold">{request.desiredName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    <Badge
                      className="mt-2"
                      variant={
                        request.status === "APPROVED"
                          ? "success"
                          : request.status === "REJECTED"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-2">
          <Link href="/sell?tab=draft">
            <Button variant={tab === "draft" ? "default" : "ghost"}>
              <FolderClock size={14} className="mr-1" />
              Drafts ({draftCount})
            </Button>
          </Link>
          <Link href="/sell?tab=active">
            <Button variant={tab === "active" ? "default" : "ghost"}>
              <Megaphone size={14} className="mr-1" />
              Active ({activeCount})
            </Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No {tab} listings yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="border-border/75">
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="line-clamp-2 text-lg font-bold">{listing.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {listing.category.name} · updated{" "}
                      {new Date(listing.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        listing.status === ListingStatus.ACTIVE
                          ? "success"
                          : "secondary"
                      }
                    >
                      {listing.status}
                    </Badge>
                    {listing.activeUntil && (
                      <Badge variant="warning">
                        Ends {new Date(listing.activeUntil).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/sell/${listing.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Edit3 size={14} className="mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/listing/${listing.id}`} className="flex-1">
                      <Button variant="ghost" className="w-full">
                        View
                      </Button>
                    </Link>
                  </div>

                  {listing.status === ListingStatus.DRAFT && (
                    <form action={deleteDraft}>
                      <input type="hidden" name="id" value={listing.id} />
                      <Button
                        variant="destructive"
                        className="w-full"
                        type="submit"
                      >
                        Delete draft
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
