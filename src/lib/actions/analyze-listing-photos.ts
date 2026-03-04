"use server";

import { ListingCondition } from "@prisma/client";

export type ListingPhotoSuggestions = {
  suggestedTitle?: string;
  suggestedCategorySlug?: string;
  suggestedBrand?: string;
  suggestedModel?: string;
  suggestedYear?: string;
  suggestedCondition?: ListingCondition;
  suggestedDescription?: string;
};

export type AnalyzeListingPhotosResult =
  | {
      ok: true;
      suggestions: ListingPhotoSuggestions;
    }
  | {
      ok: false;
      error: string;
      suggestions: ListingPhotoSuggestions;
    };

const MAX_FILES_FOR_ANALYSIS = 6;

const CATEGORY_HINTS: Array<{ slug: string; keywords: string[] }> = [
  {
    slug: "cars",
    keywords: ["car", "auto", "vehicle", "bmw", "audi", "mercedes", "vw", "golf"],
  },
  { slug: "phones", keywords: ["iphone", "samsung", "galaxy", "phone", "xiaomi"] },
  { slug: "electronics", keywords: ["laptop", "macbook", "tv", "camera", "monitor"] },
  { slug: "fashion", keywords: ["shoe", "nike", "adidas", "jacket", "dress"] },
];

const CAR_MODEL_HINTS: Record<string, string[]> = {
  audi: ["a3", "a4", "a6", "q3", "q5", "q7"],
  bmw: ["1 series", "3 series", "5 series", "x1", "x3", "x5", "x6"],
  mercedes: ["a class", "c class", "e class", "gla", "glc", "gle"],
  volkswagen: ["golf", "passat", "polo", "tiguan", "touareg"],
  vw: ["golf", "passat", "polo", "tiguan", "touareg"],
  ford: ["fiesta", "focus", "mondeo", "kuga"],
  opel: ["astra", "corsa", "insignia", "mokka"],
  skoda: ["fabia", "octavia", "superb", "kodiaq"],
  toyota: ["yaris", "corolla", "rav4", "auris"],
};

const BRAND_LABELS: Record<string, string> = {
  audi: "Audi",
  bmw: "BMW",
  mercedes: "Mercedes",
  volkswagen: "Volkswagen",
  vw: "Volkswagen",
  ford: "Ford",
  opel: "Opel",
  skoda: "Skoda",
  toyota: "Toyota",
};

function normalizeSource(value: string) {
  return value.toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveCondition(text: string) {
  if (/(new|sealed|unused|brand new)/i.test(text)) return ListingCondition.NEW;
  if (/(refurb|renewed|restored)/i.test(text)) return ListingCondition.REFURBISHED;
  if (/(used|second hand|preowned|pre-owned)/i.test(text)) return ListingCondition.USED;
  return undefined;
}

function findCategorySlug(text: string) {
  for (const category of CATEGORY_HINTS) {
    if (category.keywords.some((keyword) => text.includes(keyword))) {
      return category.slug;
    }
  }
  return undefined;
}

function findYear(text: string) {
  const match = text.match(/(?:19|20)\d{2}/);
  if (!match) return undefined;
  const year = Number(match[0]);
  const currentYear = new Date().getFullYear() + 1;
  if (year < 1950 || year > currentYear) return undefined;
  return String(year);
}

function findBrandAndModel(text: string) {
  let detectedBrand: string | undefined;
  for (const brandKey of Object.keys(CAR_MODEL_HINTS)) {
    if (text.includes(brandKey)) {
      detectedBrand = brandKey;
      break;
    }
  }
  if (!detectedBrand) return {};

  const modelCandidates = CAR_MODEL_HINTS[detectedBrand] ?? [];
  const detectedModel =
    modelCandidates.find((model) => text.includes(model.toLowerCase())) ?? undefined;

  return {
    brand: BRAND_LABELS[detectedBrand] ?? titleCase(detectedBrand),
    model: detectedModel ? titleCase(detectedModel) : undefined,
  };
}

function buildTitle(
  brand: string | undefined,
  model: string | undefined,
  year: string | undefined,
  categorySlug: string | undefined,
) {
  if (brand && model && year) return `${brand} ${model} ${year}`;
  if (brand && model) return `${brand} ${model}`;
  if (brand && year) return `${brand} ${year}`;
  if (categorySlug === "phones") return "Smartphone in good condition";
  if (categorySlug === "electronics") return "Electronics item in good condition";
  return undefined;
}

function buildDescription(
  categorySlug: string | undefined,
  condition: ListingCondition | undefined,
  locale: "en" | "mk",
) {
  if (locale === "mk") {
    if (categorySlug === "cars") {
      return "Добро одржувано возило. Контактирај за повеќе детали, сервисна историја и договор.";
    }
    return condition === ListingCondition.NEW
      ? "Производот е во многу добра состојба. Контактирај за повеќе информации."
      : "Производот е користен и функционален. Контактирај за детали и достапност.";
  }

  if (categorySlug === "cars") {
    return "Well-maintained vehicle. Contact for more details, service history, and final price.";
  }
  return condition === ListingCondition.NEW
    ? "Item is in very good condition. Contact for more information."
    : "Item is used and functional. Contact for details and availability.";
}

function buildFallbackSuggestions(
  files: File[],
  locale: "en" | "mk",
): ListingPhotoSuggestions {
  const source = normalizeSource(files.map((file) => file.name).join(" "));
  const categorySlug = findCategorySlug(source);
  const condition = resolveCondition(source);
  const year = findYear(source);
  const { brand, model } = findBrandAndModel(source);
  const title = buildTitle(brand, model, year, categorySlug);
  const description = buildDescription(categorySlug, condition, locale);

  const suggestions: ListingPhotoSuggestions = {};
  if (title) suggestions.suggestedTitle = title;
  if (categorySlug) suggestions.suggestedCategorySlug = categorySlug;
  if (brand) suggestions.suggestedBrand = brand;
  if (model) suggestions.suggestedModel = model;
  if (year) suggestions.suggestedYear = year;
  if (condition) suggestions.suggestedCondition = condition;
  if (description) suggestions.suggestedDescription = description;
  return suggestions;
}

export async function analyzeListingPhotos(
  formData: FormData,
): Promise<AnalyzeListingPhotosResult> {
  const locale = formData.get("locale") === "mk" ? "mk" : "en";
  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_FILES_FOR_ANALYSIS);

  if (files.length === 0) {
    return {
      ok: false,
      error:
        locale === "mk"
          ? "Додај барем една фотографија за анализа."
          : "Add at least one photo to analyze.",
      suggestions: {},
    };
  }

  return {
    ok: true,
    suggestions: buildFallbackSuggestions(files, locale),
  };
}
