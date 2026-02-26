import { CategoryFieldTemplate, ListingStatus } from "@prisma/client";

export const DYNAMIC_FIELD_PREFIX = "df__";

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
  templates: CategoryFieldTemplate[];
  dynamicValues: Record<string, string>;
}) {
  const errors: string[] = [];

  if (input.title.trim().length < 5) {
    errors.push("Title must be at least 5 characters to publish.");
  }

  if (input.priceCents <= 0) {
    errors.push("Price must be greater than 0 to publish.");
  }

  for (const template of input.templates) {
    if (!template.required) continue;
    const value = input.dynamicValues[template.key] ?? "";
    if (!value.trim()) {
      errors.push(`${template.label} is required to publish.`);
    }
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
