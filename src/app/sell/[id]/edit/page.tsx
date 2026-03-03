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
import { getServerLocale } from "@/lib/i18n";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
type ActionLocale = "en" | "mk";

function resolveActionLocale(value: FormDataEntryValue | null): ActionLocale {
  return value === "mk" ? "mk" : "en";
}

function getActionMessages(locale: ActionLocale) {
  if (locale === "mk") {
    return {
      dbUnavailable: "Базата е привремено недостапна",
      onlyEurMkd: "Дозволени се само EUR и MKD.",
      phoneRequired: "Телефонски број е задолжителен за објава.",
      paymentRequired:
        "Потребно е Dummy Stripe плаќање пред активација.",
      categoryRequired: "Категорија е задолжителна за објава.",
      cityRequired: "Град е задолжителен за објава.",
      categoryInvalid: "Избраната категорија е невалидна.",
      cityInvalid: "Избраниот град е невалиден.",
    };
  }

  return {
    dbUnavailable: "Database is temporarily unreachable",
    onlyEurMkd: "Only EUR and MKD are allowed.",
    phoneRequired: "Phone number is required to publish.",
    paymentRequired:
      "Dummy Stripe payment is required before activation.",
    categoryRequired: "Category is required to publish.",
    cityRequired: "City is required to publish.",
    categoryInvalid: "Selected category is invalid.",
    cityInvalid: "Selected city is invalid.",
  };
}

function resolveActiveUntil(status: ListingStatus, plan: string) {
  if (status !== ListingStatus.ACTIVE) return null;
  if (plan === "subscription") return null;
  return new Date(Date.now() + THIRTY_DAYS_MS);
}

async function updateListing(formData: FormData) {
  "use server";

  const locale = resolveActionLocale(formData.get("locale"));
  const msg = getActionMessages(locale);
  const user = await requireSeller();
  if (shouldSkipPrismaCalls()) {
    redirect(`/dashboard?error=${encodeURIComponent(msg.dbUnavailable)}`);
  }

  const id = String(formData.get("id") || "");
  const intent = String(formData.get("intent") || "draft");
  const status = statusFromIntent(intent);
  const plan = String(formData.get("plan") || "pay-per-listing");
  const paymentProvider = String(formData.get("paymentProvider") || "none");
  let isFirstPublishedPost = false;
  let hasActiveSubscription = false;
  let chargedWithDummyPayment = false;

  let listing: Awaited<ReturnType<typeof prisma.listing.findFirst>> = null;
  try {
    listing = await prisma.listing.findFirst({
      where: { id, ownerId: user.authUserId },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect(`/dashboard?error=${encodeURIComponent(msg.dbUnavailable)}`);
    }
    throw error;
  }

  if (!listing) return;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryId = String(formData.get("categoryId") || "");
  const cityId = String(formData.get("cityId") || "");
  const currencyRaw = String(formData.get("currency") || Currency.MKD);
  if (!isMarketplaceCurrency(currencyRaw)) {
    redirect(`/sell/${id}/edit?error=${encodeURIComponent(msg.onlyEurMkd)}`);
  }
  const currency = currencyRaw;
  const condition = formData.get(
    "condition",
  ) as Prisma.ListingUncheckedCreateInput["condition"];
  const phoneCountry = String(formData.get("phoneCountry") || "MK");
  const phoneRaw = String(formData.get("phone") || "").trim();
  let sellerPhoneToSave: string | null = null;
  if (phoneRaw.length > 0) {
    const normalizedPhoneResult = normalizePhoneInput(phoneRaw, phoneCountry, locale);
    if (!normalizedPhoneResult.ok) {
      redirect(`/sell/${id}/edit?error=${encodeURIComponent(normalizedPhoneResult.error)}`);
    }
    sellerPhoneToSave = normalizedPhoneResult.e164;
  } else if (status === ListingStatus.ACTIVE) {
    redirect(`/sell/${id}/edit?error=${encodeURIComponent(msg.phoneRequired)}`);
  }
  const price = Number(formData.get("price") || 0);
  const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;

  const dynamicValues = getDynamicFieldEntries(formData);

  if (status === ListingStatus.ACTIVE && listing.status === ListingStatus.DRAFT) {
    try {
      const [priorPublishedPosts, activeSubscriptionCount] = await Promise.all([
        prisma.listing.count({
          where: {
            ownerId: user.authUserId,
            id: { not: listing.id },
            status: { not: ListingStatus.DRAFT },
          },
        }),
        prisma.listing.count({
          where: {
            ownerId: user.authUserId,
            status: ListingStatus.ACTIVE,
            activeUntil: null,
            sale: null,
          },
        }),
      ]);
      markPrismaHealthy();
      isFirstPublishedPost = priorPublishedPosts === 0;
      hasActiveSubscription = activeSubscriptionCount > 0;
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        redirect(`/dashboard?error=${encodeURIComponent(msg.dbUnavailable)}`);
      }
      throw error;
    }

    if (!isFirstPublishedPost && !hasActiveSubscription && paymentProvider !== "stripe-dummy") {
      redirect(`/dashboard?error=${encodeURIComponent(msg.paymentRequired)}`);
    }
    if (!isFirstPublishedPost && !hasActiveSubscription && paymentProvider === "stripe-dummy") {
      const paymentResult = validateDummyStripePayment({
        cardNumberRaw: String(formData.get("dummyCardNumber") || ""),
        cardExpRaw: String(formData.get("dummyCardExp") || ""),
        cardCvcRaw: String(formData.get("dummyCardCvc") || ""),
      });
      if (!paymentResult.ok) {
        redirect(`/sell/${id}/edit?error=${encodeURIComponent(paymentResult.error)}`);
      }
      chargedWithDummyPayment = true;
    }
  }

  if (status === ListingStatus.ACTIVE) {
    if (!categoryId) {
      redirect(`/sell/${id}/edit?error=${encodeURIComponent(msg.categoryRequired)}`);
    }
    if (!cityId) {
      redirect(`/sell/${id}/edit?error=${encodeURIComponent(msg.cityRequired)}`);
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
        redirect(`/sell/${id}/edit?error=${encodeURIComponent(msg.categoryInvalid)}`);
      }
      if (cityExists === 0) {
        redirect(`/sell/${id}/edit?error=${encodeURIComponent(msg.cityInvalid)}`);
      }
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        redirect(`/dashboard?error=${encodeURIComponent(msg.dbUnavailable)}`);
      }
      throw error;
    }

    const validation = validatePublishInputs({
      title,
      priceCents,
      locale,
    });
    if (!validation.isValid) {
      redirect(`/sell/${id}/edit?error=${encodeURIComponent(validation.errors[0])}`);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.listing.updateMany({
        where: { id, ownerId: user.authUserId },
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
            hasActiveSubscription
              ? "subscription"
              : status === ListingStatus.ACTIVE &&
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
      redirect(`/dashboard?error=${encodeURIComponent(msg.dbUnavailable)}`);
    }
    throw error;
  }

  revalidatePath("/browse");
  revalidatePath("/sell");
  revalidatePath("/dashboard");
  revalidatePath(`/listing/${id}`);
  if (status === ListingStatus.ACTIVE && listing.status === ListingStatus.DRAFT) {
    if (isFirstPublishedPost) {
      redirect("/dashboard?free=1");
    }
    if (!isFirstPublishedPost && !hasActiveSubscription && chargedWithDummyPayment) {
      redirect("/dashboard?paid=1");
    }
  }
  if (status === ListingStatus.DRAFT) {
    redirect("/dashboard?draft=1");
  }
  redirect("/dashboard");
}

async function deleteListing(formData: FormData) {
  "use server";
  const user = await requireSeller();
  if (shouldSkipPrismaCalls()) {
    redirect("/dashboard?error=Database%20is%20temporarily%20unreachable");
  }

  const id = String(formData.get("id") || "");
  try {
    await prisma.listing.deleteMany({
      where: { id, ownerId: user.authUserId, status: ListingStatus.DRAFT },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect("/dashboard?error=Database%20is%20temporarily%20unreachable");
    }
    throw error;
  }
  revalidatePath("/sell");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export default async function EditListing({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        dbUnavailable: "Базата е привремено недостапна. Обиди се повторно наскоро.",
        backToDashboard: "Назад кон табла",
        editListing: "Уреди оглас",
        editSubtitle:
          "Ажурирај содржина, план и полиња по категорија без губење податоци.",
        payAndPublish: "Плати dummy Stripe и објави",
        publishNow: "Објави оглас",
        deleteDraft: "Избриши нацрт",
      }
    : {
        dbUnavailable: "Database is temporarily unreachable. Please retry in a moment.",
        backToDashboard: "Back to dashboard",
        editListing: "Edit listing",
        editSubtitle:
          "Update content, plan, and category fields without losing data.",
        payAndPublish: "Pay dummy Stripe & publish",
        publishNow: "Publish listing",
        deleteDraft: "Delete draft",
      };
  const user = await requireSeller();
  const { id } = await params;
  const sp = await searchParams;

  async function fetchEditData() {
    return Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { phone: true },
      }),
      prisma.listing.findFirst({
        where: { id, ownerId: user.authUserId },
        include: { images: true },
      }),
      prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.city.findMany({ orderBy: { name: "asc" } }),
      prisma.categoryFieldTemplate.findMany({
        where: { isActive: true },
        orderBy: [{ categoryId: "asc" }, { order: "asc" }],
      }),
      prisma.listingFieldValue.findMany({ where: { listingId: id } }),
      prisma.listing.count({
        where: {
          ownerId: user.authUserId,
          id: { not: id },
          status: { not: ListingStatus.DRAFT },
        },
      }),
      prisma.listing.count({
        where: {
          ownerId: user.authUserId,
          status: ListingStatus.ACTIVE,
          activeUntil: null,
          sale: null,
        },
      }),
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
            {text.dbUnavailable}
          </CardContent>
        </Card>
        <Link href="/dashboard">
          <Button variant="outline">{text.backToDashboard}</Button>
        </Link>
      </div>
    );
  }

  const [
    sellerProfile,
    listing,
    categories,
    cities,
    templates,
    fieldValues,
    priorPublishedCount,
    activeSubscriptionCount,
  ] = editData;

  if (!listing) notFound();
  const initialPhone = parseStoredPhone(sellerProfile?.phone);

  const templatesByCategory = groupTemplatesByCategory(normalizeTemplates(templates));
  const dynamicValues = Object.fromEntries(
    fieldValues.map((value) => [value.key, value.value]),
  );
  const requiresPaymentForPublish =
    listing.status === ListingStatus.DRAFT &&
    priorPublishedCount > 0 &&
    activeSubscriptionCount === 0;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">{text.editListing}</h1>
        <p className="text-sm text-muted-foreground">
          {text.editSubtitle}
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
            paymentProvider={requiresPaymentForPublish ? "stripe-dummy" : "none"}
            showPlanSelector={requiresPaymentForPublish}
            publishLabel={requiresPaymentForPublish ? text.payAndPublish : text.publishNow}
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
            locale={locale}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <form action={deleteListing}>
          <input type="hidden" name="id" value={listing.id} />
          <Button variant="destructive" type="submit">
            {text.deleteDraft}
          </Button>
        </form>
        <Link href="/dashboard">
          <Button variant="outline">{text.backToDashboard}</Button>
        </Link>
      </div>
    </div>
  );
}
