import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Currency, ListingStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { requireSeller } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingForm } from "@/components/listing-form";
import { isMarketplaceCurrency } from "@/lib/currency";
import {
  getDynamicFieldEntries,
  groupTemplatesByCategory,
  normalizeTemplates,
  statusFromIntent,
  validatePublishInputs,
} from "@/lib/listing-fields";
import { normalizePhoneInput, parseStoredPhone } from "@/lib/phone";
import { validateDummyStripePayment } from "@/lib/billing/dummy-stripe";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function resolveActiveUntil(status: ListingStatus, plan: string) {
  if (status !== ListingStatus.ACTIVE) return null;
  if (plan === "subscription") return null;
  return new Date(Date.now() + THIRTY_DAYS_MS);
}

async function updateListing(formData: FormData) {
  "use server";

  const user = await requireSeller();
  if (shouldSkipPrismaCalls()) {
    redirect("/sell/analytics?error=Database%20is%20temporarily%20unreachable");
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
      redirect("/sell/analytics?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }

  if (!listing || listing.sellerId !== user.id) return;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const cityId = String(formData.get("cityId") || "");
  const currencyRaw = String(formData.get("currency") || Currency.MKD);
  if (!isMarketplaceCurrency(currencyRaw)) {
    redirect(`/sell/${id}/edit?error=Only%20EUR%20and%20MKD%20are%20allowed.`);
  }
  const currency = currencyRaw;
  const condition = formData.get(
    "condition",
  ) as Prisma.ListingUncheckedCreateInput["condition"];
  const phoneCountry = String(formData.get("phoneCountry") || "MK");
  const phoneRaw = String(formData.get("phone") || "").trim();
  let sellerPhoneToSave: string | null = null;
  if (phoneRaw.length > 0) {
    const normalizedPhoneResult = normalizePhoneInput(phoneRaw, phoneCountry);
    if (!normalizedPhoneResult.ok) {
      redirect(`/sell/${id}/edit?error=${encodeURIComponent(normalizedPhoneResult.error)}`);
    }
    sellerPhoneToSave = normalizedPhoneResult.e164;
  } else if (status === ListingStatus.ACTIVE) {
    redirect(`/sell/${id}/edit?error=Phone%20number%20is%20required%20to%20publish.`);
  }
  const price = Number(formData.get("price") || 0);
  const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;

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
        redirect("/sell/analytics?error=Database%20is%20temporarily%20unreachable");
      }
      throw error;
    }

    if (!isFirstPublishedPost && paymentProvider !== "stripe-dummy") {
      redirect("/sell/analytics?error=Dummy%20Stripe%20payment%20is%20required%20before%20activation.");
    }
    if (!isFirstPublishedPost && paymentProvider === "stripe-dummy") {
      const paymentResult = validateDummyStripePayment({
        cardNumberRaw: String(formData.get("dummyCardNumber") || ""),
        cardExpRaw: String(formData.get("dummyCardExp") || ""),
        cardCvcRaw: String(formData.get("dummyCardCvc") || ""),
      });
      if (!paymentResult.ok) {
        redirect(`/sell/${id}/edit?error=${encodeURIComponent(paymentResult.error)}`);
      }
    }
  }

  if (status === ListingStatus.ACTIVE) {
    if (!categoryId) {
      redirect(`/sell/${id}/edit?error=Category%20is%20required%20to%20publish.`);
    }
    if (!cityId) {
      redirect(`/sell/${id}/edit?error=City%20is%20required%20to%20publish.`);
    }

    try {
      const [categoryExists, cityExists] = await Promise.all([
        prisma.category.count({
          where: { id: categoryId, isActive: true },
        }),
        prisma.city.count({
          where: { id: cityId },
        }),
      ]);
      markPrismaHealthy();
      if (categoryExists === 0) {
        redirect(`/sell/${id}/edit?error=Selected%20category%20is%20invalid.`);
      }
      if (cityExists === 0) {
        redirect(`/sell/${id}/edit?error=Selected%20city%20is%20invalid.`);
      }
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        redirect("/sell/analytics?error=Database%20is%20temporarily%20unreachable");
      }
      throw error;
    }

    const validation = validatePublishInputs({
      title,
      priceCents,
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
          currency,
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

      if (sellerPhoneToSave) {
        await tx.user.update({
          where: { id: user.id },
          data: { phone: sellerPhoneToSave },
        });
      }

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
      redirect("/sell/analytics?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }

  revalidatePath("/browse");
  revalidatePath("/sell");
  revalidatePath("/sell/analytics");
  revalidatePath(`/listing/${id}`);
  if (status === ListingStatus.ACTIVE && listing.status === ListingStatus.DRAFT) {
    if (isFirstPublishedPost) {
      redirect("/sell/analytics?free=1");
    }
    if (paymentProvider === "stripe-dummy") {
      redirect("/sell/analytics?paid=1");
    }
  }
  if (status === ListingStatus.DRAFT) {
    redirect("/sell/analytics?draft=1");
  }
  redirect("/sell/analytics");
}

async function deleteListing(formData: FormData) {
  "use server";
  const user = await requireSeller();
  if (shouldSkipPrismaCalls()) {
    redirect("/sell/analytics?error=Database%20is%20temporarily%20unreachable");
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
      redirect("/sell/analytics?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }
  revalidatePath("/sell");
  revalidatePath("/sell/analytics");
  redirect("/sell/analytics");
}

export default async function EditListing({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireSeller();
  const { id } = await params;
  const sp = await searchParams;

  async function fetchEditData() {
    return Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { phone: true },
      }),
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
        <Link href="/sell/analytics">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  const [sellerProfile, listing, categories, cities, templates, fieldValues] = editData;

  if (!listing || listing.sellerId !== user.id) notFound();
  const initialPhone = parseStoredPhone(sellerProfile?.phone);

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
              currency: listing.currency,
              condition: listing.condition,
              categoryId: listing.categoryId,
              cityId: listing.cityId,
              phone: initialPhone.localPhone,
              phoneCountry: initialPhone.countryCode,
              dynamicValues,
              plan:
                listing.status === ListingStatus.ACTIVE && !listing.activeUntil
                  ? "subscription"
                  : "pay-per-listing",
            }}
            existingImages={listing.images.map((image) => ({
              id: image.id,
              url: image.url,
            }))}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <form action={deleteListing}>
          <input type="hidden" name="id" value={listing.id} />
          <Button variant="destructive" type="submit">
            Delete draft
          </Button>
        </form>
        <Link href="/sell/analytics">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

