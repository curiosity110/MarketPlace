import type { ListingCondition } from "@prisma/client";
import type {
  ListingDetailsCategoryDetail,
  ListingDetailsLocale,
  ListingDetailsText,
} from "@/features/listing-details/types";

export function toWhatsappHref(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function buildBackToBrowseHref(
  searchParams: Record<string, string | undefined>,
) {
  const browseParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (!value) return;
    if (["reported", "error", "msg", "sold", "contacted"].includes(key)) return;
    browseParams.set(key, value);
  });
  const browseQuery = browseParams.toString();
  return {
    browseQuery,
    backToBrowseHref: browseQuery ? `/browse?${browseQuery}` : "/browse",
  };
}

export function isCarCategory(category: {
  name?: string | null;
  slug?: string | null;
  parent?: { name?: string | null } | null;
}) {
  const catName = (category?.name || "").toLowerCase();
  const parentName = (category?.parent?.name || "").toLowerCase();
  const catSlug = (category?.slug || "").toLowerCase();

  return (
    catSlug.includes("car") ||
    catName.includes("car") ||
    catName.includes("auto") ||
    catName.includes("vehicle") ||
    parentName.includes("vehicle") ||
    parentName.includes("auto")
  );
}

export function getConditionLabelMap(locale: ListingDetailsLocale) {
  if (locale === "mk") {
    return { NEW: "Ново", USED: "Користено", REFURBISHED: "Рефурбиширано" } as const;
  }
  return { NEW: "New", USED: "Used", REFURBISHED: "Refurbished" } as const;
}

export function buildCategoryDetails(
  fieldTemplates: Array<{ id: string; key: string; label: string }>,
  fieldValues: Array<{ key: string; value: string }>,
): ListingDetailsCategoryDetail[] {
  const valuesByKey = Object.fromEntries(
    fieldValues.map((field) => [field.key, field.value]),
  );
  return fieldTemplates
    .map((template) => {
      const value = valuesByKey[template.key];
      if (!value) return null;
      return {
        id: template.id,
        label: template.label,
        value,
      };
    })
    .filter((item): item is ListingDetailsCategoryDetail => Boolean(item));
}

export function getListingDetailsText(locale: ListingDetailsLocale): ListingDetailsText {
  if (locale === "mk") {
    return {
      dbUnavailable:
        "Деталите за огласот се привремено недостапни затоа што базата е недостапна.",
      backToBrowse: "Назад кон пребарување",
      share: "Сподели",
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
      mediaEmptyTitle: "Нема фотографии",
      mediaEmptyHint: "Продавачот сè уште нема додадено фотографии за овој оглас.",
      listedIn: "Град",
      category: "Категорија",
      condition: "Состојба",
    };
  }

  return {
    dbUnavailable:
      "Listing details are temporarily unavailable because the database is unreachable.",
    backToBrowse: "Back to browse",
    share: "Share",
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
    mediaEmptyTitle: "No photos yet",
    mediaEmptyHint: "The seller has not added photos for this listing yet.",
    listedIn: "City",
    category: "Category",
    condition: "Condition",
  };
}

export function getConditionLabel(
  locale: ListingDetailsLocale,
  condition: ListingCondition,
) {
  return getConditionLabelMap(locale)[condition];
}
