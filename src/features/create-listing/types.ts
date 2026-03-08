import { Currency, ListingCondition } from "@prisma/client";
import type {
  CreateFieldErrorKey,
  CreateListingActionResult,
  CreateListingWizardProps,
  CreateSubmitIntent,
} from "@/components/create-listing/state/wizard-form.types";
import type {
  CreateListingCategory,
  CreateListingCity,
  CreateListingPlan,
  CreateListingTemplate,
} from "@/components/create-listing/types";

export type CreateListingCategoryOption = CreateListingCategory;
export type CreateListingCityOption = CreateListingCity;
export type CreateListingTemplateMap = Record<string, CreateListingTemplate[]>;
export type CreateListingPlanOption = CreateListingPlan;
export type CreateListingSubmitIntent = CreateSubmitIntent;
export type CreateListingResult = CreateListingActionResult;
export type CreateListingFieldErrorKey = CreateFieldErrorKey;
export type CreateListingWizardStep = 1 | 2 | 3;

export type CreateListingStepMeta = {
  step: CreateListingWizardStep;
  title: string;
};

export type CreateListingPhoneCountryOption = {
  value: string;
  label: string;
};

export type CreateListingPaymentDraft = {
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardholder: string;
};

export type CreateListingInitialValues = {
  id?: string;
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

export type CreateListingFormProps = CreateListingWizardProps;
