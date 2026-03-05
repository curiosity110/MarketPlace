import { Currency, ListingStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { CreateListingGlobal } from "@/components/create-listing-global";
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

export async function CreateListingGlobalServer({
  forceOpen = false,
  sessionUser: providedSessionUser,
  ignoreCircuitBreaker = false,
}: CreateListingGlobalServerProps = {}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const sessionUser = providedSessionUser ?? (await getSessionUser());

  if (
    !sessionUser ||
    !canSell(sessionUser.role) ||
    (!ignoreCircuitBreaker && shouldSkipPrismaCalls())
  ) {
    return null;
  }

  try {
    const [{ categories, cities, templates }, userRecord, publishedCount, activeSubscriptionCount] =
      await Promise.all([
        getCreateModalMeta(),
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

    markPrismaHealthy();

    const templatesByCategory = groupTemplatesByCategory(
      normalizeTemplates(templates),
    );
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
      <CreateListingGlobal
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
      if (!forceOpen) return null;

      return (
        <CreateListingGlobal
          action={createListingFromSell}
          categories={[]}
          cities={[]}
          templatesByCategory={{}}
          publishLabel={isMk ? "Објави оглас" : "Publish listing"}
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
