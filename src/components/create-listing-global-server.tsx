import { Currency, ListingStatus } from "@prisma/client";
import { CreateListingGlobal } from "@/components/create-listing-global";
import { CreateListingPopout } from "@/components/create-listing-popout";
import { createListingFromDashboard } from "@/lib/actions/create-listing";
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
  renderInline?: boolean;
  ignoreCircuitBreaker?: boolean;
};

export async function CreateListingGlobalServer({
  forceOpen = false,
  sessionUser: providedSessionUser,
  renderInline = false,
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
    const [
      categories,
      cities,
      templates,
      userRecord,
      publishedCount,
      activeSubscriptionCount,
    ] = await Promise.all([
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
      prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { phone: true },
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

    if (categories.length === 0 || cities.length === 0) return null;

    const templatesByCategory = groupTemplatesByCategory(
      normalizeTemplates(templates),
    );
    const parsedPhone = parseStoredPhone(userRecord?.phone);
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

    if (renderInline) {
      return (
        <CreateListingPopout
          mode="card"
          openOnMount={forceOpen}
          action={createListingFromDashboard}
          categories={categories}
          cities={cities}
          templatesByCategory={templatesByCategory}
          allowDraft={false}
          showPlanSelector={requiresPaymentForCreate}
          publishLabel={publishLabel}
          paymentProvider={requiresPaymentForCreate ? "stripe-dummy" : "none"}
          locale={locale}
          initial={{
            categoryId: categories[0]?.id,
            phone: parsedPhone.localPhone,
            phoneCountry: parsedPhone.countryCode,
            currency: Currency.MKD,
          }}
        />
      );
    }

    return (
      <CreateListingGlobal
        action={createListingFromDashboard}
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
          phoneCountry: parsedPhone.countryCode,
          currency: Currency.MKD,
        }}
      />
    );
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return null;
    }
    throw error;
  }
}
