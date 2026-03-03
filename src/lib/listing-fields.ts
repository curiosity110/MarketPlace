import { CategoryFieldTemplate, ListingStatus } from "@prisma/client";

export const DYNAMIC_FIELD_PREFIX = "df__";
export type ValidationLocale = "en" | "mk";

type FieldTemplateWithOptions = CategoryFieldTemplate & { options: string[] };

export function parseTemplateOptions(template: Pick<CategoryFieldTemplate, "optionsJson">): string[] {
  if (!template.optionsJson) return [];

  try {
    const parsed = JSON.parse(template.optionsJson);
    if (Array.isArray(parsed)) {
      return parsed.map((value) => String(value));
    }
  } catch {
    return [];
  }

  return [];
}

export function normalizeTemplates(templates: CategoryFieldTemplate[]): FieldTemplateWithOptions[] {
  return templates.map((template) => ({
    ...template,
    options: parseTemplateOptions(template),
  }));
}

export function getDynamicFieldEntries(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(DYNAMIC_FIELD_PREFIX)) continue;
    const dynamicKey = key.slice(DYNAMIC_FIELD_PREFIX.length).trim();
    if (!dynamicKey) continue;
    values[dynamicKey] = String(value ?? "").trim();
  }

  return values;
}

export function validatePublishInputs(input: {
  title: string;
  priceCents: number;
  locale?: ValidationLocale;
}) {
  const errors: string[] = [];
  const locale = input.locale === "mk" ? "mk" : "en";
  const messages =
    locale === "mk"
      ? {
          titleMin: "Насловот мора да има најмалку 5 карактери за објава.",
          priceMin: "Цената мора да биде поголема од 0 за објава.",
        }
      : {
          titleMin: "Title must be at least 5 characters to publish.",
          priceMin: "Price must be greater than 0 to publish.",
        };

  if (input.title.trim().length < 5) {
    errors.push(messages.titleMin);
  }

  if (input.priceCents <= 0) {
    errors.push(messages.priceMin);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function statusFromIntent(intent: string | null): ListingStatus {
  return intent === "publish" ? ListingStatus.ACTIVE : ListingStatus.DRAFT;
}

export function groupTemplatesByCategory(templates: FieldTemplateWithOptions[]) {
  return templates.reduce<Record<string, FieldTemplateWithOptions[]>>((acc, template) => {
    acc[template.categoryId] = acc[template.categoryId] ? [...acc[template.categoryId], template] : [template];
    return acc;
  }, {});
}
