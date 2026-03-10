import { ListingStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  ListingDetailsDbUnavailable,
  ListingDetailsFlashMessages,
} from "@/components/listing-details";
import { RecordListingView } from "@/components/recently-viewed/record-listing-view";
import { ContactSellerPopout } from "@/components/contact-seller-popout";
import { BackLink, PageShell } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { ListingContact } from "@/features/listing-details/listing-contact";
import { ListingContactCta } from "@/features/listing-details/listing-contact-cta";
import { ListingDescription } from "@/features/listing-details/listing-description";
import { ListingExtraDetails } from "@/features/listing-details/listing-extra-details";
import { ListingHero } from "@/features/listing-details/listing-hero";
import { ListingMedia } from "@/features/listing-details/listing-media";
import { ListingSimilar } from "@/features/listing-details/listing-similar";
import { ListingTopActions } from "@/features/listing-details/listing-top-actions";
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
import { listingCardSelect } from "@/lib/listing-card-select";
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

  async function fetchSimilarListings(excludeId: string, categoryId: string) {
    return prisma.listing.findMany({
      where: {
        id: { not: excludeId },
        categoryId,
        status: ListingStatus.ACTIVE,
        sale: null,
      },
      ...listingCardSelect,
      orderBy: { createdAt: "desc" },
      take: 4,
    });
  }

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
            username: true,
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

  const dateListed =
    listing.createdAt instanceof Date
      ? listing.createdAt.toLocaleDateString(locale === "mk" ? "mk-MK" : "en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";

  let similarListings: Awaited<ReturnType<typeof fetchSimilarListings>> = [];
  if (!shouldSkipPrismaCalls()) {
    try {
      similarListings = await fetchSimilarListings(listing.id, listing.categoryId);
      markPrismaHealthy();
    } catch (error) {
      if (isPrismaConnectionError(error)) markPrismaUnavailable();
    }
  }

  const similarIds = new Set(similarListings.map((l) => l.id));
  let similarFavoriteIds = new Set<string>();
  if (sessionUser && similarIds.size > 0) {
    try {
      const favs = await prisma.favorite.findMany({
        where: { userId: sessionUser.id, listingId: { in: Array.from(similarIds) } },
        select: { listingId: true },
      });
      similarFavoriteIds = new Set(favs.map((f) => f.listingId));
    } catch {
      // ignore
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
  const displaySellerName =
    listing.seller.name || listing.seller.username || listing.seller.email;

  return (
    <PageShell size="wide" className="space-y-5 pb-24 sm:space-y-6 sm:pb-8">
      <RecordListingView listingId={listing.id} />
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
        <ListingTopActions
          locale={locale}
          listingId={listing.id}
          priceCents={listing.priceCents}
          isOwner={isOwner}
          isAuthenticated={Boolean(sessionUser)}
          isFavorited={isFavorited}
          isSold={Boolean(listing.sale)}
          browseQuery={browseQuery}
          text={text}
        />
      </div>

      {/* 1. Image gallery (top) + 2. Title + Price + 3. Key details */}
      <section className="space-y-4 sm:space-y-5">
        <ListingMedia
          locale={locale}
          imageUrls={listing.images.map((image) => image.url)}
          title={listing.title}
          text={text}
        />

        <ListingHero
          category={categoryLabel}
          condition={listing.condition}
          title={listing.title}
          price={listing.priceCents}
          currency={listing.currency}
          location={listing.city.name}
          dateListed={dateListed}
          locale={locale}
          text={{ price: text.price, listed: text.listed }}
        />

        <ListingContactCta
          listingId={listing.id}
          locale={locale}
          sellerPhone={listing.seller.phone}
          whatsappHref={whatsappHref}
          isOwner={isOwner}
          isSold={Boolean(listing.sale)}
          text={{
            contactSeller: text.contactSeller,
            call: text.call,
            whatsapp: text.whatsapp,
          }}
        />
      </section>

      {/* Description & extra details */}
      <section className="space-y-4 sm:space-y-5">
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

        <ListingExtraDetails
          locale={locale}
          categoryDetailsTitle={text.categoryDetails}
          categoryDetails={categoryDetails}
          valuesByKey={valuesByKey}
          isCarCategory={isCarCategorySelected}
        />
      </section>

      {/* Seller profile block */}
      <ListingContact
        locale={locale}
        listingId={listing.id}
        sellerId={listing.seller.id}
        sellerNameOrEmail={displaySellerName}
        sellerPhone={listing.seller.phone}
        sellerEmail={listing.seller.email}
        isOwner={isOwner}
        isSold={Boolean(listing.sale)}
        browseQuery={browseQuery}
        whatsappHref={whatsappHref}
        cityName={listing.city.name}
        text={text}
      />

      {similarListings.length > 0 && (
        <ListingSimilar
          listings={similarListings}
          locale={locale}
          currentAuthUserId={sessionUser?.authUserId}
          favoriteListingIdSet={similarFavoriteIds}
          browseQuery={browseQuery}
          title={text.similarListings}
        />
      )}

      {/* Sticky contact seller button (mobile) — visible without scrolling */}
      {!isOwner && !listing.sale && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/96 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.18)] backdrop-blur-md sm:hidden">
          {listing.seller.phone ? (
            <a href={`tel:${listing.seller.phone}`} className="block">
              <Button
                size="lg"
                className="h-12 w-full justify-center gap-2 rounded-full"
              >
                {text.contactSeller}
              </Button>
            </a>
          ) : (
            <ContactSellerPopout
              listingId={listing.id}
              locale={locale}
              className="h-12 w-full justify-center rounded-full"
            />
          )}
        </div>
      )}
    </PageShell>
  );
}
