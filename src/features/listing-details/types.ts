import type { Currency, ListingCondition } from "@prisma/client";

export type ListingDetailsLocale = "en" | "mk";

export type ListingDetailsCategoryDetail = {
  id: string;
  label: string;
  value: string;
};

export type ListingDetailsText = {
  dbUnavailable: string;
  backToBrowse: string;
  price: string;
  reportSubmitted: string;
  description: string;
  categoryDetails: string;
  noCategoryDetails: string;
  seller: string;
  report: string;
  reportListing: string;
  reportHelp: string;
  reportReason: string;
  reportReasonFake: string;
  reportReasonScam: string;
  reportReasonSpam: string;
  reportReasonOther: string;
  reportDetails: string;
  submitReport: string;
  sellerContact: string;
  phone: string;
  phoneNotSet: string;
  viewProfile: string;
  contactSeller: string;
  call: string;
  whatsapp: string;
  edit: string;
  sold: string;
  mediaEmptyTitle: string;
  mediaEmptyHint: string;
  listedIn: string;
  category: string;
  condition: string;
};

export type ListingDetailsMetaProps = {
  cityName: string;
  categoryLabel: string;
  conditionLabel: string;
  text: Pick<ListingDetailsText, "listedIn" | "category" | "condition">;
};

export type ListingDetailsSummaryProps = {
  locale: ListingDetailsLocale;
  title: string;
  cityName: string;
  categoryLabel: string;
  condition: ListingCondition;
  priceCents: number;
  currency: Currency;
  listingId: string;
  isOwner: boolean;
  isAuthenticated: boolean;
  isFavorited: boolean;
  isSold: boolean;
  text: ListingDetailsText;
};

export type ListingDetailsSellerCardProps = {
  locale: ListingDetailsLocale;
  listingId: string;
  sellerId: string;
  sellerNameOrEmail: string;
  sellerPhone: string | null;
  isOwner: boolean;
  isSold: boolean;
  browseQuery: string;
  whatsappHref: string | null;
  text: ListingDetailsText;
};

export type ListingDescriptionProps = {
  locale: ListingDetailsLocale;
  descriptionTitle: string;
  description: string;
  categoryDetailsTitle: string;
  noCategoryDetailsLabel: string;
  categoryDetails: ListingDetailsCategoryDetail[];
  valuesByKey: Record<string, string>;
  isCarCategory: boolean;
};
