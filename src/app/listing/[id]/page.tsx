import { notFound } from "next/navigation";
import { ListingStatus } from "@prisma/client";
import {
  buildBackToBrowseHref,
  buildCategoryDetails,
  getConditionLabelMap,
  isCarCategory,
  ListingDetailsDbUnavailable,
  ListingDetailsDescriptionSection,
  ListingDetailsExtraSection,
  ListingDetailsFlashMessages,
  ListingDetailsHeader,
  ListingDetailsMediaPanel,
  ListingDetailsSellerPanel,
  toWhatsappHref,
} from "@/components/listing-details";
import { BackButton, PageContainer } from "@/components/ui/layout";
import { getSessionUser } from "@/lib/auth";
import { localizeCategoryPath } from "@/lib/category-label";
import { getServerLocale } from "@/lib/i18n";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

export default async function ListingDetails({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Listing details container: resolves access/data and composes stable detail panels.
  const locale = await getServerLocale();
  const sessionUser = await getSessionUser();
  const isMk = locale === "mk";

  const text = isMk
    ? {
        dbUnavailable:
          "Деталите за огласот се привремено недостапни затоа што базата е недостапна.",
        backToBrowse: "Назад кон пребарување",
        price: "Цена",
        reportSubmitted:
          "Пријавата е поднесена. Благодариме што помагаш маркетплејсот да е побезбеден.",
        description: "Опис",
        categoryDetails: "Детали за категорија",
        noCategoryDetails: "Не се внесени детали за категорија.",
        seller: "Продавач",
        report: "Пријави",
        reportListing: "Пријави го овој оглас",
        reportHelp: "Ако нешто изгледа небезбедно или лажно, пријави за проверка.",
        reportReason: "Причина",
        reportReasonFake: "Лажен оглас",
        reportReasonScam: "Измама",
        reportReasonSpam: "Спам",
        reportReasonOther: "Друго",
        reportDetails: "Детали (опционално)",
        submitReport: "Поднеси пријава",
        sellerContact: "Контакт од продавач",
        phone: "Телефон",
        phoneNotSet: "Сè уште нема телефон",
        viewProfile: "Погледни профил",
        contactSeller: "Контактирај",
        call: "Јави се",
        whatsapp: "WhatsApp",
        edit: "Уреди",
        sold: "Продадено",
      }
    : {
        dbUnavailable:
          "Listing details are temporarily unavailable because the database is unreachable.",
        backToBrowse: "Back to browse",
        price: "Price",
        reportSubmitted:
          "Report submitted. Thank you for helping keep the marketplace safe.",
        description: "Description",
        categoryDetails: "Category details",
        noCategoryDetails: "No category details were provided.",
        seller: "Seller",
        report: "Report",
        reportListing: "Report this listing",
        reportHelp: "If something looks unsafe or fake, report it for review.",
        reportReason: "Reason",
        reportReasonFake: "Fake listing",
        reportReasonScam: "Scam",
        reportReasonSpam: "Spam",
        reportReasonOther: "Other",
        reportDetails: "Details (optional)",
        submitReport: "Submit report",
        sellerContact: "Seller contact",
        phone: "Phone",
        phoneNotSet: "Phone not set yet",
        viewProfile: "View profile",
        contactSeller: "Contact seller",
        call: "Call",
        whatsapp: "WhatsApp",
        edit: "Edit",
        sold: "Sold",
      };

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
  const isCarCategorySelected = isCarCategory(listing.category);
  const categoryLabel = localizeCategoryPath(listing.category, locale);
  const conditionLabelByValue = getConditionLabelMap(locale);
  const whatsappHref = toWhatsappHref(listing.seller.phone);

  return (
    <PageContainer size="wide" className="space-y-6 pb-2 sm:space-y-7">
      <BackButton label={text.backToBrowse} fallbackHref={backToBrowseHref} />

      <ListingDetailsHeader
        locale={locale}
        title={listing.title}
        cityName={listing.city.name}
        categoryLabel={categoryLabel}
        conditionLabel={conditionLabelByValue[listing.condition]}
        priceCents={listing.priceCents}
        currency={listing.currency}
        listingId={listing.id}
        isOwner={isOwner}
        isAuthenticated={Boolean(sessionUser)}
        isFavorited={isFavorited}
        isSold={Boolean(listing.sale)}
        text={{ price: text.price, sold: text.sold, edit: text.edit }}
      />

      <ListingDetailsFlashMessages
        reportSaved={reportSaved}
        soldSaved={soldSaved}
        contactedSaved={contactedSaved}
        msg={msg}
        reportError={reportError}
        reportSubmittedLabel={text.reportSubmitted}
      />

      <div className="grid max-w-full min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] xl:gap-6">
        <div className="min-w-0 space-y-4">
          <ListingDetailsMediaPanel
            locale={locale}
            imageUrls={listing.images.map((image) => image.url)}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <div className="max-w-full rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm sm:p-5">
            <ListingDetailsDescriptionSection
              title={text.description}
              description={listing.description}
            />
            <div className="mt-4">
              <ListingDetailsExtraSection
                locale={locale}
                categoryDetailsLabel={text.categoryDetails}
                noCategoryDetailsLabel={text.noCategoryDetails}
                categoryDetails={categoryDetails}
                valuesByKey={valuesByKey}
                isCarCategory={isCarCategorySelected}
              />
            </div>
          </div>

          <ListingDetailsSellerPanel
            locale={locale}
            listingId={listing.id}
            sellerId={listing.seller.id}
            sellerNameOrEmail={listing.seller.name || listing.seller.email}
            sellerPhone={listing.seller.phone}
            isOwner={isOwner}
            isSold={Boolean(listing.sale)}
            backToBrowseHref={backToBrowseHref}
            browseQuery={browseQuery}
            whatsappHref={whatsappHref}
            text={{
              seller: text.seller,
              report: text.report,
              reportListing: text.reportListing,
              reportHelp: text.reportHelp,
              reportReason: text.reportReason,
              reportReasonFake: text.reportReasonFake,
              reportReasonScam: text.reportReasonScam,
              reportReasonSpam: text.reportReasonSpam,
              reportReasonOther: text.reportReasonOther,
              reportDetails: text.reportDetails,
              submitReport: text.submitReport,
              sellerContact: text.sellerContact,
              phone: text.phone,
              phoneNotSet: text.phoneNotSet,
              viewProfile: text.viewProfile,
              backToBrowse: text.backToBrowse,
              contactSeller: text.contactSeller,
              call: text.call,
              whatsapp: text.whatsapp,
            }}
          />
        </div>
      </div>
    </PageContainer>
  );
}
