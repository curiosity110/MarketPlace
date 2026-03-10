import type { ListingCondition } from "@prisma/client";
import {
  inferCreateErrorField,
  inferCreateErrorStep,
} from "@/components/create-listing/state/wizard-form.helpers";
import { localizeCategoryName } from "@/lib/category-label";
import type {
  CreateListingCategoryOption,
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
    if (/(title|наслов|category|категори|city|град)/i.test(serverError)) {
      return 2;
    }

    if (/(phone|телефон|price|цена)/i.test(serverError)) {
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

function normalizeCreateTemplateIdentifier(input: string) {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getCreateListingPrimaryTemplateKeys(
  templates: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
  }>,
) {
  const prioritizedPatterns = [
    /(brand|make|manufacturer|model|year|storage|memory|ram|size|service type|company|position|sqm|square meters|rooms|material)/,
    /(fuel|transmission|km|kilometers|mileage|color)/,
  ];

  const sorted = [...templates]
    .map((template) => {
      const source = normalizeCreateTemplateIdentifier(`${template.key} ${template.label}`);
      const priority =
        prioritizedPatterns.findIndex((pattern) => pattern.test(source)) >= 0
          ? prioritizedPatterns.findIndex((pattern) => pattern.test(source))
          : 99;

      return {
        key: template.key,
        required: Boolean(template.required),
        type: template.type,
        priority,
      };
    })
    .filter((template) => template.priority < 99 || template.required)
    .filter((template) => template.type !== "BOOLEAN")
    .sort((left, right) => {
      if (left.priority !== right.priority) return left.priority - right.priority;
      if (left.required !== right.required) return left.required ? -1 : 1;
      return left.key.localeCompare(right.key);
    });

  return [...new Set(sorted.slice(0, 3).map((template) => template.key))];
}

export function normalizeCreateListingSearchText(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function filterCreateListingCategories(
  categories: CreateListingCategoryOption[],
  query: string,
  locale: "en" | "mk",
) {
  const normalizedQuery = normalizeCreateListingSearchText(query);
  if (!normalizedQuery) return categories;

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return categories
    .map((category) => {
      const localizedName = localizeCategoryName(category, locale);
      const haystacks = [
        normalizeCreateListingSearchText(localizedName),
        normalizeCreateListingSearchText(category.name),
        normalizeCreateListingSearchText(category.slug.replace(/-/g, " ")),
      ];

      let score = 0;
      for (const haystack of haystacks) {
        if (!haystack) continue;
        if (haystack === normalizedQuery) score = Math.max(score, 100);
        if (haystack.startsWith(normalizedQuery)) score = Math.max(score, 75);
        if (haystack.includes(normalizedQuery)) score = Math.max(score, 50);

        const tokenScore = queryTokens.reduce((sum, token) => {
          if (haystack.startsWith(token)) return sum + 12;
          if (haystack.includes(token)) return sum + 6;
          return sum;
        }, 0);
        score = Math.max(score, tokenScore);
      }

      return { category, localizedName, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.localizedName.localeCompare(b.localizedName, locale);
    })
    .map((entry) => entry.category);
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
      choosePhotos: "Додај",
      selectedPhotos: "избрани фотографии",
      addPhotosFirst: "Додај фотографии прво",
      titleGroupHint: "Краток и јасен наслов е доволен за почеток.",
      packageHint: "Избери како сакаш да се објави огласот.",
      contactHint: "Телефонот е главниот контакт за купувачите.",
      openWhenNeeded: "Отвори ја формата кога ќе ти треба.",
    };
  }

  return {
    createListing: "Create listing",
    subtitle: "Add the essentials, then publish when you are ready.",
    close: "Close",
    closeCreateListingForm: "Close create listing form",
    quickFillSecondary: "Quick fill",
    quickFillSecondaryHint: "Optional: get suggestions from one short line.",
    choosePhotos: "Add",
    selectedPhotos: "selected photos",
    addPhotosFirst: "Add photos first",
    titleGroupHint: "A short, clear title is enough to get started.",
    packageHint: "Choose how you want this listing to be published.",
    contactHint: "Phone is the main contact buyers will use.",
    openWhenNeeded: "Open the form only when you need it.",
  };
}
