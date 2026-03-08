import type { ListingCondition } from "@prisma/client";
import {
  inferCreateErrorField,
  inferCreateErrorStep,
} from "@/components/create-listing/state/wizard-form.helpers";
import type {
  CreateListingFieldErrorKey,
  CreateListingPhoneCountryOption,
  CreateListingPlanOption,
  CreateListingStepMeta,
  CreateListingWizardStep,
} from "@/features/create-listing/types";

export function getCreateListingInitialStep({
  serverError,
  serverErrorField,
}: {
  serverError?: string | null;
  serverErrorField?: string | null;
}): CreateListingWizardStep {
  if (
    serverErrorField === "title" ||
    serverErrorField === "categoryId" ||
    serverErrorField === "cityId"
  ) {
    return 2;
  }

  if (serverErrorField === "phone" || serverErrorField === "price") {
    return 3;
  }

  if (serverError) {
    if (/(title|Ð½Ð°ÑÐ»Ð¾Ð²|category|ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸|city|Ð³Ñ€Ð°Ð´)/i.test(serverError)) {
      return 2;
    }

    if (/(phone|Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½|price|Ñ†ÐµÐ½Ð°)/i.test(serverError)) {
      return 3;
    }
  }

  return 1;
}

export function resolveCreatePaymentAmount(plan: CreateListingPlanOption) {
  return plan === "subscription" ? 30 : 4;
}

export function resolveCreateNormalizedErrorField(
  serverErrorMessage: string | null,
  serverErrorFieldState: string | null,
) {
  return inferCreateErrorField(
    serverErrorMessage,
    serverErrorFieldState,
  ) as CreateListingFieldErrorKey;
}

export function resolveCreateJumpStep(
  field?: CreateListingFieldErrorKey,
  message?: string | null,
) {
  return inferCreateErrorStep(field, message ?? undefined);
}

export function resolveCreatePaymentLabel(
  plan: CreateListingPlanOption,
  labels: {
    subscription: string;
    payPerListing: string;
  },
) {
  return plan === "subscription" ? labels.subscription : labels.payPerListing;
}

export function resolveCreateConditionOptions(
  labels: Record<ListingCondition, string>,
) {
  return [
    { value: "NEW" as const, label: labels.NEW },
    { value: "USED" as const, label: labels.USED },
    { value: "REFURBISHED" as const, label: labels.REFURBISHED },
  ];
}

export function getCreateListingStepMeta(
  step: CreateListingWizardStep,
  labels: {
    photos: string;
    basics: string;
    price: string;
  },
): CreateListingStepMeta {
  if (step === 1) {
    return { step, title: labels.photos };
  }

  if (step === 2) {
    return { step, title: labels.basics };
  }

  return { step, title: labels.price };
}

export function getCreateListingPhoneCountryOptions(): CreateListingPhoneCountryOption[] {
  return [
    { value: "MK", label: "+389" },
    { value: "RS", label: "+381" },
    { value: "AL", label: "+355" },
    { value: "GR", label: "+30" },
    { value: "TR", label: "+90" },
    { value: "DE", label: "+49" },
    { value: "GB", label: "+44" },
  ];
}

export function getCreateListingModalText(locale: "en" | "mk") {
  if (locale === "mk") {
    return {
      createListing: "ÐšÑ€ÐµÐ¸Ñ€Ð°Ñ˜ Ð¾Ð³Ð»Ð°Ñ",
      subtitle:
        "Ð’Ð½ÐµÑÐ¸ Ð³Ð¸ Ð¾ÑÐ½Ð¾Ð²Ð½Ð¸Ñ‚Ðµ Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ð¸, Ð¿Ð° Ð¾Ð±Ñ˜Ð°Ð²Ð¸ ÐºÐ¾Ð³Ð° ÑœÐµ Ð±Ð¸Ð´ÐµÑˆ Ð¿Ð¾Ð´Ð³Ð¾Ñ‚Ð²ÐµÐ½.",
      close: "Ð—Ð°Ñ‚Ð²Ð¾Ñ€Ð¸",
      closeCreateListingForm: "Ð—Ð°Ñ‚Ð²Ð¾Ñ€Ð¸ Ñ„Ð¾Ñ€Ð¼Ð° Ð·Ð° ÐºÑ€ÐµÐ¸Ñ€Ð°ÑšÐµ Ð¾Ð³Ð»Ð°Ñ",
      quickFillSecondary: "Ð‘Ñ€Ð·Ð¾ Ð¿Ð¾Ð¿Ð¾Ð»Ð½ÑƒÐ²Ð°ÑšÐµ",
      quickFillSecondaryHint: "ÐžÐ¿Ñ†Ð¸Ð¾Ð½Ð°Ð»Ð½Ð¾: Ð´Ð¾Ð±Ð¸Ñ˜ Ð¿Ñ€ÐµÐ´Ð»Ð¾Ð·Ð¸ Ð¾Ð´ ÐµÐ´Ð½Ð° Ð»Ð¸Ð½Ð¸Ñ˜Ð° Ñ‚ÐµÐºÑÑ‚.",
      choosePhotos: "Ð˜Ð·Ð±ÐµÑ€Ð¸ Ñ„Ð¾Ñ‚Ð¾Ð³Ñ€Ð°Ñ„Ð¸Ð¸",
      selectedPhotos: "Ð¸Ð·Ð±Ñ€Ð°Ð½Ð¸ Ñ„Ð¾Ñ‚Ð¾Ð³Ñ€Ð°Ñ„Ð¸Ð¸",
      addPhotosFirst: "Ð”Ð¾Ð´Ð°Ñ˜ Ñ„Ð¾Ñ‚Ð¾Ð³Ñ€Ð°Ñ„Ð¸Ð¸ Ð¿Ñ€Ð²Ð¾",
      titleGroupHint: "ÐšÑ€Ð°Ñ‚Ð¾Ðº Ð¸ Ñ˜Ð°ÑÐµÐ½ Ð½Ð°ÑÐ»Ð¾Ð² Ðµ Ð´Ð¾Ð²Ð¾Ð»ÐµÐ½ Ð·Ð° Ð¿Ð¾Ñ‡ÐµÑ‚Ð¾Ðº.",
      packageHint: "Ð˜Ð·Ð±ÐµÑ€Ð¸ ÐºÐ°ÐºÐ¾ ÑÐ°ÐºÐ°Ñˆ Ð´Ð° ÑÐµ Ð¾Ð±Ñ˜Ð°Ð²Ð¸ Ð¾Ð³Ð»Ð°ÑÐ¾Ñ‚.",
      contactHint: "Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½Ð¾Ñ‚ Ðµ Ð³Ð»Ð°Ð²Ð½Ð¸Ð¾Ñ‚ ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚ Ð·Ð° ÐºÑƒÐ¿ÑƒÐ²Ð°Ñ‡Ð¸Ñ‚Ðµ.",
      openWhenNeeded: "ÐžÑ‚Ð²Ð¾Ñ€Ð¸ Ñ˜Ð° Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ð° ÐºÐ¾Ð³Ð° Ñ‚Ð¸ Ñ‚Ñ€ÐµÐ±Ð°.",
    };
  }

  return {
    createListing: "Create listing",
    subtitle: "Add the essentials, then publish when you are ready.",
    close: "Close",
    closeCreateListingForm: "Close create listing form",
    quickFillSecondary: "Quick fill",
    quickFillSecondaryHint: "Optional: get suggestions from one short line.",
    choosePhotos: "Choose photos",
    selectedPhotos: "selected photos",
    addPhotosFirst: "Add photos first",
    titleGroupHint: "A short, clear title is enough to get started.",
    packageHint: "Choose how you want this listing to be published.",
    contactHint: "Phone is the main contact buyers will use.",
    openWhenNeeded: "Open the form only when you need it.",
  };
}
