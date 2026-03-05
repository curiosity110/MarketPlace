import { Currency, ListingStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { CreateListingModalController } from "@/components/create-listing-modal-controller";
import { createListingFromSell } from "@/lib/actions/create-listing";
import { canSell, getSessionUser } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n";
import {
  groupTemplatesByCategory,
  normalizeTemplates,
} from "@/lib/listing-fields";
import { parseStoredPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

type CreateListingGlobalServerProps = {
  forceOpen?: boolean;
  sessionUser?: SessionUser | null;
  ignoreCircuitBreaker?: boolean;
};

const getCreateModalMeta = unstable_cache(
  async () => {
    const [categories, cities, templates] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.city.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.categoryFieldTemplate.findMany({
        where: { isActive: true, category: { isActive: true } },
        orderBy: [{ categoryId: "asc" }, { order: "asc" }],
      }),
    ]);

    return { categories, cities, templates };
  },
  ["create-listing-modal-meta"],
  { revalidate: 300 },
);

function fallbackPublishLabel(isMk: boolean) {
  return isMk ? "Објави оглас" : "Publish listing";
}

export async function CreateListingGlobalServer({
  forceOpen = false,
  sessionUser: providedSessionUser,
  ignoreCircuitBreaker = false,
}: CreateListingGlobalServerProps = {}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const sessionUser = providedSessionUser ?? (await getSessionUser());

  if (!ignoreCircuitBreaker && shouldSkipPrismaCalls()) {
    return (
      <CreateListingModalController
        action={createListingFromSell}
        categories={[]}
        cities={[]}
        templatesByCategory={{}}
        publishLabel={fallbackPublishLabel(isMk)}
        paymentProvider="none"
        showPlanSelector={false}
        locale={locale}
        forceOpen={forceOpen}
        initial={{
          currency: Currency.MKD,
        }}
      />
    );
  }

  try {
    const { categories, cities, templates } = await getCreateModalMeta();
    const templatesByCategory = groupTemplatesByCategory(
      normalizeTemplates(templates),
    );
    markPrismaHealthy();

    if (!sessionUser || !canSell(sessionUser.role)) {
      return (
        <CreateListingModalController
          action={createListingFromSell}
          categories={categories}
          cities={cities}
          templatesByCategory={templatesByCategory}
          publishLabel={fallbackPublishLabel(isMk)}
          paymentProvider="none"
          showPlanSelector={false}
          locale={locale}
          forceOpen={forceOpen}
          initial={{
            categoryId: categories[0]?.id,
            currency: Currency.MKD,
          }}
        />
      );
    }

    const [userRecord, publishedCount, activeSubscriptionCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          phone: true,
          defaultCountry: true,
          defaultPhone: true,
          defaultCityId: true,
          defaultDeliveryText: true,
        },
      }),
      prisma.listing.count({
        where: {
          ownerId: sessionUser.authUserId,
          status: { not: ListingStatus.DRAFT },
        },
      }),
      prisma.listing.count({
        where: {
          ownerId: sessionUser.authUserId,
          status: ListingStatus.ACTIVE,
          activeUntil: null,
          sale: null,
        },
      }),
    ]);

    const parsedPhone = parseStoredPhone(
      userRecord?.defaultPhone || userRecord?.phone,
    );
    const hasActiveSubscription = activeSubscriptionCount > 0;
    const requiresPaymentForCreate =
      publishedCount > 0 && !hasActiveSubscription;
    const publishLabel = requiresPaymentForCreate
      ? isMk
        ? "Плати dummy Stripe и објави"
        : "Pay dummy Stripe & publish"
      : hasActiveSubscription
        ? isMk
          ? "Објави со активна претплата"
          : "Publish with active subscription"
        : isMk
          ? "Објави прв 30-дневен оглас (бесплатно)"
          : "Publish first 30-day listing (free)";

    return (
      <CreateListingModalController
        action={createListingFromSell}
        categories={categories}
        cities={cities}
        templatesByCategory={templatesByCategory}
        publishLabel={publishLabel}
        paymentProvider={requiresPaymentForCreate ? "stripe-dummy" : "none"}
        showPlanSelector={requiresPaymentForCreate}
        locale={locale}
        forceOpen={forceOpen}
        initial={{
          categoryId: categories[0]?.id,
          phone: parsedPhone.localPhone,
          phoneCountry: userRecord?.defaultCountry || parsedPhone.countryCode,
          cityId: userRecord?.defaultCityId || undefined,
          description: userRecord?.defaultDeliveryText || undefined,
          currency: Currency.MKD,
        }}
      />
    );
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return (
        <CreateListingModalController
          action={createListingFromSell}
          categories={[]}
          cities={[]}
          templatesByCategory={{}}
          publishLabel={fallbackPublishLabel(isMk)}
          paymentProvider="none"
          showPlanSelector={false}
          locale={locale}
          forceOpen={forceOpen}
          initial={{
            currency: Currency.MKD,
          }}
        />
      );
    }
    throw error;
  }
}
