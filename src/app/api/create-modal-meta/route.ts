import { Currency, ListingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { canSell, getSessionUser } from "@/lib/auth";
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
import {
  LOCALE_COOKIE,
  LEGACY_LOCALE_COOKIE,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";

function fallbackPublishLabel(isMk: boolean) {
  return isMk ? "Објави оглас" : "Publish listing";
}

export async function GET() {
  const locale = await (async (): Promise<Locale> => {
    const cookieStore = await cookies();
    const fromCookie =
      cookieStore.get(LOCALE_COOKIE)?.value ||
      cookieStore.get(LEGACY_LOCALE_COOKIE)?.value;
    return normalizeLocale(fromCookie);
  })();
  const isMk = locale === "mk";
  const sessionUser = await getSessionUser();

  if (!shouldSkipPrismaCalls()) {
    try {
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
      markPrismaHealthy();

      const templatesByCategory = groupTemplatesByCategory(
        normalizeTemplates(templates),
      );

      if (!sessionUser || !canSell(sessionUser.role)) {
        return NextResponse.json({
          categories,
          cities,
          templatesByCategory,
          publishLabel: fallbackPublishLabel(isMk),
          paymentProvider: "none" as const,
          showPlanSelector: false,
          initial: {
            categoryId: categories[0]?.id,
            currency: Currency.MKD,
          },
          locale,
        });
      }

      const [userRecord, publishedCount, activeSubscriptionCount] =
        await Promise.all([
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

      return NextResponse.json({
        categories,
        cities,
        templatesByCategory,
        publishLabel,
        paymentProvider: requiresPaymentForCreate ? "stripe-dummy" : "none",
        showPlanSelector: requiresPaymentForCreate,
        initial: {
          categoryId: categories[0]?.id,
          phone: parsedPhone.localPhone,
          phoneCountry: userRecord?.defaultCountry || parsedPhone.countryCode,
          cityId: userRecord?.defaultCityId || undefined,
          description: userRecord?.defaultDeliveryText || undefined,
          currency: Currency.MKD,
        },
        locale,
      });
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
      } else {
        throw error;
      }
    }
  }

  return NextResponse.json({
    categories: [],
    cities: [],
    templatesByCategory: {},
    publishLabel: fallbackPublishLabel(isMk),
    paymentProvider: "none" as const,
    showPlanSelector: false,
    initial: { currency: Currency.MKD },
    locale,
  });
}
