import { ListingStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { ListingDetailsDbUnavailable, ListingDetailsFlashMessages } from "@/components/listing-details";
import { BackLink, PageShell } from "@/components/ui/layout";
import { ListingDescription } from "@/features/listing-details/listing-description";
import { ListingMedia } from "@/features/listing-details/listing-media";
import { ListingSellerCard } from "@/features/listing-details/seller-card";
import { ListingSummary } from "@/features/listing-details/listing-summary";
import {
  buildBackToBrowseHref,
  buildCategoryDetails,
  getListingDetailsText,
  isCarCategory,
  toWhatsappHref,
} from "@/features/listing-details/utils";
import { getSessionUser } from "@/lib/auth";
import { localizeCategoryPath } from "@/lib/category-label";
import { getServerLocale } from "@/lib/i18n";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";

export async function ListingDetailsFeaturePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const locale = await getServerLocale();
  const sessionUser = await getSessionUser();
  const text = getListingDetailsText(locale);

  const { id } = await params;
  const sp = await searchParams;
  const reportSaved = sp.reported === "1";
  const reportError = sp.error;
  const msg = sp.msg;
  const soldSaved = sp.sold === "1";
  const contactedSaved = sp.contacted === "1";
  const { browseQuery, backToBrowseHref } = buildBackToBrowseHref(sp);

  async function fetchListingDetails() {
    return prisma.listing.findUnique({
      where: { id },
      include: {
        city: true,
        category: {
          include: {
            parent: true,
            fieldTemplates: {
              where: { isActive: true },
              orderBy: { order: "asc" },
            },
          },
        },
        images: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        fieldValues: true,
        sale: {
          select: {
            id: true,
            soldAt: true,
          },
        },
      },
    });
  }

  let listing: Awaited<ReturnType<typeof fetchListingDetails>> = null;
  let dbUnavailable = false;

  try {
    if (!shouldSkipPrismaCalls()) {
      listing = await fetchListingDetails();
      markPrismaHealthy();
    } else {
      dbUnavailable = true;
    }
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      dbUnavailable = true;
    } else {
      throw error;
    }
  }

  if (dbUnavailable) {
    return (
      <ListingDetailsDbUnavailable
        backLabel={text.backToBrowse}
        backHref={backToBrowseHref}
        message={text.dbUnavailable}
      />
    );
  }

  if (!listing) notFound();

  const isOwner = Boolean(sessionUser?.authUserId === listing.ownerId);
  const isPublicVisible = listing.status === ListingStatus.ACTIVE && !listing.sale;
  if (!isOwner && !isPublicVisible) notFound();

  let isFavorited = false;
  if (sessionUser && !isOwner && !shouldSkipPrismaCalls()) {
    try {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_listingId: {
            userId: sessionUser.id,
            listingId: listing.id,
          },
        },
        select: { id: true },
      });
      isFavorited = Boolean(favorite);
      markPrismaHealthy();
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
      } else {
        throw error;
      }
    }
  }

  const valuesByKey = Object.fromEntries(
    listing.fieldValues.map((field) => [field.key, field.value]),
  );
  const categoryDetails = buildCategoryDetails(
    listing.category.fieldTemplates.map((template) => ({
      id: template.id,
      key: template.key,
      label: template.label,
    })),
    listing.fieldValues.map((field) => ({ key: field.key, value: field.value })),
  );
  const categoryLabel = localizeCategoryPath(listing.category, locale);
  const whatsappHref = toWhatsappHref(listing.seller.phone);
  const isCarCategorySelected = isCarCategory(listing.category);

  return (
    <PageShell size="wide" className="space-y-4 pb-4 sm:space-y-6 sm:pb-6">
      <ListingDetailsFlashMessages
        reportSaved={reportSaved}
        soldSaved={soldSaved}
        contactedSaved={contactedSaved}
        msg={msg}
        reportError={reportError}
        reportSubmittedLabel={text.reportSubmitted}
      />

      <div className="flex items-center justify-between gap-3">
        <BackLink label={text.backToBrowse} fallbackHref={backToBrowseHref} className="w-fit" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.7fr)] xl:gap-8">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <ListingMedia
            locale={locale}
            imageUrls={listing.images.map((image) => image.url)}
            title={listing.title}
            text={text}
          />

          <ListingDescription
            locale={locale}
            descriptionTitle={text.description}
            description={listing.description}
            categoryDetailsTitle={text.categoryDetails}
            noCategoryDetailsLabel={text.noCategoryDetails}
            categoryDetails={categoryDetails}
            valuesByKey={valuesByKey}
            isCarCategory={isCarCategorySelected}
          />
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24">
          <ListingSummary
            locale={locale}
            title={listing.title}
            cityName={listing.city.name}
            categoryLabel={categoryLabel}
            condition={listing.condition}
            priceCents={listing.priceCents}
            currency={listing.currency}
            listingId={listing.id}
            isOwner={isOwner}
            isAuthenticated={Boolean(sessionUser)}
            isFavorited={isFavorited}
            isSold={Boolean(listing.sale)}
            text={text}
          />

          <ListingSellerCard
            locale={locale}
            listingId={listing.id}
            sellerId={listing.seller.id}
            sellerNameOrEmail={listing.seller.name || listing.seller.email}
            sellerPhone={listing.seller.phone}
            isOwner={isOwner}
            isSold={Boolean(listing.sale)}
            browseQuery={browseQuery}
            whatsappHref={whatsappHref}
            text={text}
          />
        </aside>
      </div>
    </PageShell>
  );
}
