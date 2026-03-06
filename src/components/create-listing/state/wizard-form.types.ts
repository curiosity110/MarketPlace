import { Currency, ListingCondition } from "@prisma/client";
import type {
  CreateListingCategory,
  CreateListingCity,
  CreateListingPlan,
  CreateListingTemplate,
} from "@/components/create-listing/types";

export type CreateListingWizardProps = {
  action: (formData: FormData) => Promise<unknown> | unknown;
  categories: CreateListingCategory[];
  cities: CreateListingCity[];
  templatesByCategory: Record<string, CreateListingTemplate[]>;
  allowDraft?: boolean;
  showPlanSelector?: boolean;
  publishLabel?: string;
  paymentProvider?: "none" | "stripe-dummy";
  initial?: {
    title?: string;
    description?: string;
    price?: number;
    currency?: Currency;
    condition?: ListingCondition;
    categoryId?: string;
    cityId?: string;
    phone?: string;
    phoneCountry?: string;
    dynamicValues?: Record<string, string>;
    plan?: CreateListingPlan;
  };
  locale?: "en" | "mk";
  serverError?: string | null;
  serverErrorField?: string | null;
  defaultsSaved?: boolean;
  onPublished?: () => void;
};

export type CreateFieldErrorKey =
  | "title"
  | "categoryId"
  | "cityId"
  | "price"
  | "phone"
  | "general";

export type CreateSubmitIntent = "publish" | "draft" | "save-defaults" | "unknown";

export type CreateListingActionResult =
  | {
      ok: true;
      listingId: string;
      status: "ACTIVE" | "DRAFT";
      message?: string;
    }
  | {
      ok: false;
      error: string;
      field?: CreateFieldErrorKey;
      listingId?: string;
      needsEdit?: boolean;
    };
