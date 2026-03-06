import type { ListingCondition } from "@prisma/client";
import { inferCreateErrorField, inferCreateErrorStep } from "@/components/create-listing/state/wizard-form.helpers";
import type {
  CreateListingFieldErrorKey,
  CreateListingPlanOption,
} from "@/features/create-listing/types";

export function getCreateListingInitialStep({
  serverError,
  serverErrorField,
}: {
  serverError?: string | null;
  serverErrorField?: string | null;
}) {
  if (serverErrorField === "title" || serverErrorField === "categoryId" || serverErrorField === "price") {
    return 2;
  }

  if (serverErrorField === "cityId" || serverErrorField === "phone") {
    return 3;
  }

  if (serverError) {
    if (/(title|наслов|category|категори|price|цена)/i.test(serverError)) return 2;
    if (/(city|град|phone|телефон)/i.test(serverError)) return 3;
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

export function getCreateListingModalText(locale: "en" | "mk") {
  if (locale === "mk") {
    return {
      createListing: "Креирај оглас",
      subtitle: "Внеси ги основните информации, па објави кога ќе бидеш подготвен.",
      close: "Затвори",
      closeCreateListingForm: "Затвори форма за креирање оглас",
      quickFillSecondary: "Брзо пополнување",
      quickFillSecondaryHint: "Опционално: добиј предлози од една линија текст.",
      choosePhotos: "Избери фотографии",
      selectedPhotos: "избрани фотографии",
      addPhotosFirst: "Додај фотографии прво",
      titleGroupHint: "Краток и јасен наслов е доволен за почеток.",
      packageHint: "Избери како сакаш да се објави огласот.",
      contactHint: "Телефонот е главниот контакт за купувачите.",
      openWhenNeeded: "Отвори ја формата кога ти треба.",
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
