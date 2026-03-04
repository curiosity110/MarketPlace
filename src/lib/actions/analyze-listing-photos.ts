"use server";

import { ListingCondition } from "@prisma/client";
import { openai } from "@/lib/openai";

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
const MAX_IMAGE_BYTES_FOR_ANALYSIS = 4 * 1024 * 1024;
const OPENAI_MODEL = "gpt-4o-mini";

const CATEGORY_HINTS: Array<{ slug: string; keywords: string[] }> = [
  {
    slug: "cars",
    keywords: [
      "car",
      "auto",
      "vehicle",
      "sedan",
      "hatchback",
      "suv",
      "bmw",
      "audi",
      "mercedes",
      "vw",
      "golf",
      "passat",
    ],
  },
  {
    slug: "phones",
    keywords: ["iphone", "samsung", "galaxy", "phone", "xiaomi", "pixel"],
  },
  {
    slug: "electronics",
    keywords: [
      "laptop",
      "macbook",
      "tv",
      "camera",
      "monitor",
      "playstation",
      "xbox",
      "pc",
    ],
  },
  {
    slug: "fashion",
    keywords: ["shoe", "nike", "adidas", "jacket", "dress", "bag"],
  },
];

const CAR_MODEL_HINTS: Record<string, string[]> = {
  audi: ["a1", "a3", "a4", "a6", "q3", "q5", "q7"],
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
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function clipText(value: string, maxChars: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars - 1).trimEnd()}...`;
}

function hasSuggestionValues(suggestions: ListingPhotoSuggestions) {
  return Object.values(suggestions).some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    return Boolean(value);
  });
}

function toOptionalTrimmedString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveCondition(text: string) {
  const enumKey = text.trim().toUpperCase();
  if (
    enumKey === ListingCondition.NEW ||
    enumKey === ListingCondition.USED ||
    enumKey === ListingCondition.REFURBISHED
  ) {
    return enumKey;
  }

  if (/(new|sealed|unused|brand\s*new|novo)/i.test(text)) {
    return ListingCondition.NEW;
  }
  if (/(refurb|renewed|restored|rekond|recondition)/i.test(text)) {
    return ListingCondition.REFURBISHED;
  }
  if (/(used|second hand|preowned|pre-owned|korist|polovn)/i.test(text)) {
    return ListingCondition.USED;
  }
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

function sanitizeYear(value: string | undefined) {
  if (!value) return undefined;
  const match = value.match(/(?:19|20)\d{2}/);
  if (!match) return undefined;

  const year = Number(match[0]);
  const maxYear = new Date().getFullYear() + 1;
  if (year < 1950 || year > maxYear) return undefined;
  return String(year);
}

function findYear(text: string) {
  return sanitizeYear(text);
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

function normalizeCategorySlug(value: string | undefined) {
  if (!value) return undefined;

  const normalized = normalizeSource(value);
  if (!normalized) return undefined;

  if (CATEGORY_HINTS.some((entry) => entry.slug === normalized)) {
    return normalized;
  }

  if (normalized.includes("car") || normalized.includes("auto")) return "cars";
  if (normalized.includes("phone") || normalized.includes("mobile")) return "phones";
  if (
    normalized.includes("electronic") ||
    normalized.includes("laptop") ||
    normalized.includes("camera") ||
    normalized.includes("console")
  ) {
    return "electronics";
  }
  if (normalized.includes("fashion") || normalized.includes("cloth")) return "fashion";

  return findCategorySlug(normalized);
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
  if (categorySlug === "cars") return "Car in good condition";
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
      return "\u0414\u043e\u0431\u0440\u043e \u043e\u0434\u0440\u0436\u0443\u0432\u0430\u043d\u043e \u0432\u043e\u0437\u0438\u043b\u043e. \u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438\u0440\u0430\u0458 \u0437\u0430 \u043f\u043e\u0432\u0435\u045c\u0435 \u0434\u0435\u0442\u0430\u043b\u0438.";
    }
    return condition === ListingCondition.NEW
      ? "\u041f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u043e\u0442 \u0435 \u0432\u043e \u043e\u0434\u043b\u0438\u0447\u043d\u0430 \u0441\u043e\u0441\u0442\u043e\u0458\u0431\u0430. \u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438\u0440\u0430\u0458 \u0437\u0430 \u043f\u043e\u0432\u0435\u045c\u0435 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u0438."
      : "\u041f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u043e\u0442 \u0435 \u043a\u043e\u0440\u0438\u0441\u0442\u0435\u043d \u0438 \u0444\u0443\u043d\u043a\u0446\u0438\u043e\u043d\u0430\u043b\u0435\u043d. \u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438\u0440\u0430\u0458 \u0437\u0430 \u0434\u0435\u0442\u0430\u043b\u0438 \u0438 \u0434\u043e\u0441\u0442\u0430\u043f\u043d\u043e\u0441\u0442.";
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

function parseJsonObject(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    // Continue with fallback parsing.
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced) {
    try {
      return JSON.parse(fenced) as Record<string, unknown>;
    } catch {
      // Continue with fallback parsing.
    }
  }

  const objectSnippet = trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (!objectSnippet) return null;

  try {
    return JSON.parse(objectSnippet) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function sanitizeModelSuggestions(
  raw: Record<string, unknown>,
  locale: "en" | "mk",
): ListingPhotoSuggestions {
  const category = normalizeCategorySlug(
    toOptionalTrimmedString(raw.suggestedCategorySlug) ??
      toOptionalTrimmedString(raw.categorySlug) ??
      toOptionalTrimmedString(raw.category),
  );
  const brand =
    toOptionalTrimmedString(raw.suggestedBrand) ??
    toOptionalTrimmedString(raw.brand);
  const model =
    toOptionalTrimmedString(raw.suggestedModel) ??
    toOptionalTrimmedString(raw.model);
  const year = sanitizeYear(
    toOptionalTrimmedString(raw.suggestedYear) ?? toOptionalTrimmedString(raw.year),
  );
  const condition = resolveCondition(
    toOptionalTrimmedString(raw.suggestedCondition) ??
      toOptionalTrimmedString(raw.condition) ??
      "",
  );
  const explicitTitle =
    toOptionalTrimmedString(raw.suggestedTitle) ??
    toOptionalTrimmedString(raw.title);
  const explicitDescription =
    toOptionalTrimmedString(raw.suggestedDescription) ??
    toOptionalTrimmedString(raw.description);

  const title = clipText(
    explicitTitle ?? buildTitle(brand, model, year, category) ?? "",
    90,
  );
  const description = clipText(
    explicitDescription ?? buildDescription(category, condition, locale) ?? "",
    360,
  );

  const suggestions: ListingPhotoSuggestions = {};
  if (title) suggestions.suggestedTitle = title;
  if (category) suggestions.suggestedCategorySlug = category;
  if (brand) suggestions.suggestedBrand = clipText(brand, 40);
  if (model) suggestions.suggestedModel = clipText(model, 40);
  if (year) suggestions.suggestedYear = year;
  if (condition) suggestions.suggestedCondition = condition;
  if (description) suggestions.suggestedDescription = description;

  return suggestions;
}

function mergeSuggestions(
  primary: ListingPhotoSuggestions,
  fallback: ListingPhotoSuggestions,
): ListingPhotoSuggestions {
  const merged: ListingPhotoSuggestions = { ...fallback };

  if (primary.suggestedTitle?.trim()) {
    merged.suggestedTitle = primary.suggestedTitle.trim();
  }
  if (primary.suggestedCategorySlug?.trim()) {
    merged.suggestedCategorySlug = primary.suggestedCategorySlug.trim();
  }
  if (primary.suggestedBrand?.trim()) {
    merged.suggestedBrand = primary.suggestedBrand.trim();
  }
  if (primary.suggestedModel?.trim()) {
    merged.suggestedModel = primary.suggestedModel.trim();
  }
  if (primary.suggestedYear?.trim()) {
    merged.suggestedYear = primary.suggestedYear.trim();
  }
  if (primary.suggestedCondition) {
    merged.suggestedCondition = primary.suggestedCondition;
  }
  if (primary.suggestedDescription?.trim()) {
    merged.suggestedDescription = primary.suggestedDescription.trim();
  }

  return merged;
}

async function fileToDataUrl(file: File) {
  const mimeType = file.type || "image/jpeg";
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

async function analyzeWithOpenAi(
  files: File[],
  locale: "en" | "mk",
): Promise<ListingPhotoSuggestions | null> {
  const imageParts: Array<{ type: "image_url"; image_url: { url: string } }> = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    if (file.size > MAX_IMAGE_BYTES_FOR_ANALYSIS) continue;

    const imageUrl = await fileToDataUrl(file);
    imageParts.push({ type: "image_url", image_url: { url: imageUrl } });
  }

  if (imageParts.length === 0) return null;

  const targetLanguage =
    locale === "mk" ? "Macedonian written in Cyrillic" : "English";

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.1,
    max_tokens: 420,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You extract listing metadata from marketplace photos. Return only a JSON object with keys: " +
          "suggestedTitle, suggestedCategorySlug, suggestedBrand, suggestedModel, suggestedYear, suggestedCondition, suggestedDescription. " +
          "Use null for unknown values. suggestedCondition must be NEW, USED, or REFURBISHED. " +
          "suggestedCategorySlug must be one of: cars, phones, electronics, fashion, or null.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Analyze these marketplace photos and suggest metadata in ${targetLanguage}. ` +
              "Title should be concise and realistic (max 90 chars). " +
              "Description should be short (1-3 sentences). " +
              "Only include a year when it is visible or strongly implied.",
          },
          ...imageParts,
        ],
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;

  const parsed = parseJsonObject(content);
  if (!parsed) return null;

  const suggestions = sanitizeModelSuggestions(parsed, locale);
  return hasSuggestionValues(suggestions) ? suggestions : null;
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
          ? "\u0414\u043e\u0434\u0430\u0458 \u0431\u0430\u0440\u0435\u043c \u0435\u0434\u043d\u0430 \u0444\u043e\u0442\u043e\u0433\u0440\u0430\u0444\u0438\u0458\u0430 \u0437\u0430 \u0430\u043d\u0430\u043b\u0438\u0437\u0430."
          : "Add at least one photo to analyze.",
      suggestions: {},
    };
  }

  const fallbackSuggestions = buildFallbackSuggestions(files, locale);

  try {
    const aiSuggestions = await analyzeWithOpenAi(files, locale);
    if (aiSuggestions) {
      return {
        ok: true,
        suggestions: mergeSuggestions(aiSuggestions, fallbackSuggestions),
      };
    }
  } catch (error) {
    console.error("Photo analysis fallback triggered:", error);
  }

  if (hasSuggestionValues(fallbackSuggestions)) {
    return {
      ok: true,
      suggestions: fallbackSuggestions,
    };
  }

  return {
    ok: false,
    error:
      locale === "mk"
        ? "\u041d\u0435 \u043c\u043e\u0436\u0435\u0432 \u0434\u0430 \u0438\u0437\u0432\u043b\u0435\u0447\u0430\u043c \u0441\u0438\u0433\u0443\u0440\u043d\u0438 \u043f\u0440\u0435\u0434\u043b\u043e\u0437\u0438 \u043e\u0434 \u0444\u043e\u0442\u043e\u0433\u0440\u0430\u0444\u0438\u0438\u0442\u0435."
        : "I could not extract confident suggestions from these photos.",
    suggestions: fallbackSuggestions,
  };
}
