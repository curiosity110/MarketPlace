import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ListingStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Camera } from "lucide-react";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

async function updateListing(formData: FormData) {
  "use server";

  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    redirect("/sell?error=Database%20is%20temporarily%20unreachable");
  }

  const id = String(formData.get("id") || "");
  const intent = String(formData.get("intent") || "draft");
  const status = statusFromIntent(intent);
  const plan = String(formData.get("plan") || "pay-per-listing");
  const paymentProvider = String(formData.get("paymentProvider") || "none");
  let isFirstPublishedPost = false;

  let listing: Awaited<ReturnType<typeof prisma.listing.findUnique>> = null;
  try {
    listing = await prisma.listing.findUnique({ where: { id } });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/sell?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }

  if (!listing || listing.sellerId !== user.id) return;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const cityId = String(formData.get("cityId") || "");
  const condition = formData.get(
    "condition",
  ) as Prisma.ListingUncheckedCreateInput["condition"];
  const price = Number(formData.get("price") || 0);
  const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;

  let templates: Awaited<ReturnType<typeof prisma.categoryFieldTemplate.findMany>> = [];
  try {
    templates = await prisma.categoryFieldTemplate.findMany({
      where: { categoryId, isActive: true },
      orderBy: { order: "asc" },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/sell?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }
  const dynamicValues = getDynamicFieldEntries(formData);

  if (status === ListingStatus.ACTIVE && listing.status === ListingStatus.DRAFT) {
    try {
      const priorPublishedPosts = await prisma.listing.count({
        where: {
          sellerId: user.id,
          id: { not: listing.id },
          status: { not: ListingStatus.DRAFT },
        },
      });
      markPrismaHealthy();
      isFirstPublishedPost = priorPublishedPosts === 0;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        redirect("/sell?error=Database%20is%20temporarily%20unreachable");
      }
      throw error;
    }

    if (!isFirstPublishedPost && paymentProvider !== "stripe-dummy") {
      redirect("/sell?error=Dummy%20Stripe%20payment%20is%20required%20before%20activation.");
    }
  }

  if (status === ListingStatus.ACTIVE) {
    const validation = validatePublishInputs({
      title,
      priceCents,
      templates,
      dynamicValues,
    });
    if (!validation.isValid) {
      redirect(`/sell/${id}/edit?error=${encodeURIComponent(validation.errors[0])}`);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id },
        data: {
          title,
          description,
          priceCents,
          categoryId,
          cityId,
          condition,
          status,
          activeUntil: resolveActiveUntil(
            status,
            status === ListingStatus.ACTIVE &&
              listing.status === ListingStatus.DRAFT &&
              isFirstPublishedPost
              ? "pay-per-listing"
              : plan,
          ),
        },
      });

      await tx.listingFieldValue.deleteMany({ where: { listingId: id } });

      const entries = Object.entries(dynamicValues).filter(
        ([, value]) => value.trim().length > 0,
      );
      if (entries.length > 0) {
        await tx.listingFieldValue.createMany({
          data: entries.map(([key, value]) => ({ listingId: id, key, value })),
        });
      }
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/sell?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }

  revalidatePath("/browse");
  revalidatePath("/sell");
  revalidatePath(`/listing/${id}`);
  if (status === ListingStatus.ACTIVE && listing.status === ListingStatus.DRAFT) {
    if (isFirstPublishedPost) {
      redirect("/sell?free=1");
    }
    if (paymentProvider === "stripe-dummy") {
      redirect("/sell?paid=1");
    }
  }
  redirect("/sell");
}

async function deleteListing(formData: FormData) {
  "use server";
  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    redirect("/sell?error=Database%20is%20temporarily%20unreachable");
  }

  const id = String(formData.get("id") || "");
  try {
    await prisma.listing.deleteMany({
      where: { id, sellerId: user.id, status: ListingStatus.DRAFT },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/sell?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }
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

  async function fetchEditData() {
    return Promise.all([
      prisma.listing.findUnique({ where: { id }, include: { images: true } }),
      prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.city.findMany({ orderBy: { name: "asc" } }),
      prisma.categoryFieldTemplate.findMany({
        where: { isActive: true },
        orderBy: [{ categoryId: "asc" }, { order: "asc" }],
      }),
      prisma.listingFieldValue.findMany({ where: { listingId: id } }),
    ]);
  }

  let editData: Awaited<ReturnType<typeof fetchEditData>> | null = null;
  try {
    if (!shouldSkipPrismaCalls()) {
      editData = await fetchEditData();
      markPrismaHealthy();
    }
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      editData = null;
    } else {
      throw error;
    }
  }

  if (!editData) {
    return (
      <div className="space-y-4">
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-5 text-sm text-foreground">
            Database is temporarily unreachable. Please retry in a moment.
          </CardContent>
        </Card>
        <Link href="/sell">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  const [listing, categories, cities, templates, fieldValues] = editData;

  if (!listing || listing.sellerId !== user.id) notFound();

  const templatesByCategory = groupTemplatesByCategory(normalizeTemplates(templates));
  const dynamicValues = Object.fromEntries(
    fieldValues.map((value) => [value.key, value.value]),
  );

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Edit listing</h1>
        <p className="text-sm text-muted-foreground">
          Update content, plan, and category fields without losing data.
        </p>
      </section>

      {sp.error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">
            {sp.error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <ListingForm
            action={updateListing}
            categories={categories}
            cities={cities}
            templatesByCategory={templatesByCategory}
            paymentProvider="stripe-dummy"
            publishLabel="Pay dummy Stripe & publish"
            initial={{
              id: listing.id,
              title: listing.title,
              description: listing.description,
              price: listing.priceCents / 100,
              condition: listing.condition,
              categoryId: listing.categoryId,
              cityId: listing.cityId,
              dynamicValues,
              plan:
                listing.status === ListingStatus.ACTIVE && !listing.activeUntil
                  ? "subscription"
                  : "pay-per-listing",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Camera size={18} className="text-secondary" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action="/api/upload"
            method="post"
            encType="multipart/form-data"
            className="space-y-2"
          >
            <input type="hidden" name="listingId" value={listing.id} />
            <Input type="file" name="file" accept="image/*" required />
            <Button variant="outline" type="submit">
              Upload image
            </Button>
          </form>
          {listing.images.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {listing.images.map((image) => (
                <li key={image.id}>
                  <a
                    className="break-all text-muted-foreground underline hover:text-primary"
                    href={image.url}
                    target="_blank"
                  >
                    {image.url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No images uploaded yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <form action={deleteListing}>
          <input type="hidden" name="id" value={listing.id} />
          <Button variant="destructive" type="submit">
            Delete draft
          </Button>
        </form>
        <Link href="/sell">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
