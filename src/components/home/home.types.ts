import type { Locale } from "@/lib/i18n";
import type { ListingCardDTO } from "@/lib/listing-card-select";

export type HomeText = {
  heroBadge: string;
  heroTitleA: string;
  heroTitleB: string;
  heroDesc: string;
  explore: string;
  startSelling: string;
  smartAssistance: string;
  smartAssistanceDesc: string;
  saferTrading: string;
  saferTradingDesc: string;
  localGlobal: string;
  localGlobalDesc: string;
  popularCategories: string;
  whatBuyNow: string;
  listings: string;
  viewAllCategories: string;
  dbUnavailable: string;
  sellerPricing: string;
  sellerPricingDesc: string;
  recommended: string;
  latestListings: string;
  latestListingsDesc: string;
  noListings: string;
  listItem: string;
  browseAll: string;
};

export type HomePricingPlan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  bullets: string[];
  cta: string;
  href: string;
  featured: boolean;
};

export type HomeQuickItem = {
  id: string;
  label: string;
  hint?: string;
  href: string;
};

export type HomeCategoryHighlight = {
  id: string;
  name: string;
  slug: string;
  _count: {
    listings: number;
  };
};

export type HomeLatestListing = ListingCardDTO;

export type HomePageContent = {
  locale: Locale;
  text: HomeText;
  pricingPlans: HomePricingPlan[];
  quickTitle: string;
  quickItems: HomeQuickItem[];
};
