import { ListingCondition } from "@prisma/client";

export type QuickFillLocale = "en" | "mk";

export type QuickFillCategoryInput = {
  id: string;
  slug: string;
  parentId?: string | null;
  name: string;
  [key: string]: unknown;
};

export type QuickFillCityInput = {
  id: string;
  name: string;
};

export type QuickFillConfidence = "high" | "medium" | "low";

export type QuickFillSuggestionField =
  | "brand"
  | "model"
  | "year"
  | "condition"
  | "city"
  | "price"
  | "fuel"
  | "transmission"
  | "kilometers"
  | "description";

export type QuickFillSuggestion = {
  field: QuickFillSuggestionField;
  value: string;
  confidence: QuickFillConfidence;
  categoryId?: string;
  cityId?: string;
  condition?: ListingCondition;
};

export type QuickFillCategoryCandidate = {
  categoryId: string;
  label: string;
  confidence: QuickFillConfidence;
};

export type QuickFillResult = {
  suggestions: QuickFillSuggestion[];
  categoryCandidates: QuickFillCategoryCandidate[];
};

type BrandEntry = {
  brand: string;
  aliases: string[];
  models: string[];
};

const CAR_BRANDS: BrandEntry[] = [
  {
    brand: "Audi",
    aliases: ["audi"],
    models: ["a3", "a4", "a6", "q3", "q5", "q7"],
  },
  {
    brand: "BMW",
    aliases: ["bmw"],
    models: ["116", "118", "320", "330", "520", "x1", "x3", "x5"],
  },
  {
    brand: "Volkswagen",
    aliases: ["volkswagen", "vw"],
    models: ["golf", "passat", "polo", "tiguan", "touareg"],
  },
  {
    brand: "Mercedes-Benz",
    aliases: ["mercedes", "mercedes benz", "benz"],
    models: ["c class", "e class", "a class", "gla", "glc", "gle"],
  },
  {
    brand: "Opel",
    aliases: ["opel"],
    models: ["astra", "corsa", "insignia", "mokka"],
  },
  {
    brand: "Ford",
    aliases: ["ford"],
    models: ["fiesta", "focus", "mondeo", "kuga"],
  },
  {
    brand: "Toyota",
    aliases: ["toyota"],
    models: ["yaris", "corolla", "auris", "rav4"],
  },
];

const FUEL_HINTS: Array<{ value: string; keywords: string[] }> = [
  { value: "Diesel", keywords: ["diesel", "dizel", "дизел", "tdi", "dci", "hdi"] },
  { value: "Petrol", keywords: ["petrol", "benzin", "бензин", "tsi", "mpi"] },
  { value: "Hybrid", keywords: ["hybrid", "хибрид"] },
  { value: "Electric", keywords: ["electric", "ev", "електрик", "струја"] },
];

const TRANSMISSION_HINTS: Array<{ value: string; keywords: string[] }> = [
  { value: "Automatic", keywords: ["automatic", "auto", "автоматик", "автоматски", "dsg"] },
  { value: "Manual", keywords: ["manual", "manuell", "мануелен", "рачен"] },
];

const CONDITION_HINTS: Array<{ value: ListingCondition; keywords: string[] }> = [
  { value: ListingCondition.NEW, keywords: ["new", "brand new", "ново", "неупотребуван"] },
  { value: ListingCondition.USED, keywords: ["used", "second hand", "polovno", "користено", "половен"] },
  {
    value: ListingCondition.REFURBISHED,
    keywords: ["refurbished", "renewed", "rekondicioniran", "рефурбиширан"],
  },
];

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  const normalized = normalize(value);
  return normalized ? normalized.split(" ").filter(Boolean) : [];
}

function containsWord(source: string, candidate: string) {
  if (!source || !candidate) return false;
  const pattern = new RegExp(`(^|\\s)${candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`, "i");
  return pattern.test(source);
}

function findCondition(normalizedText: string) {
  for (const entry of CONDITION_HINTS) {
    if (entry.keywords.some((keyword) => containsWord(normalizedText, normalize(keyword)))) {
      return entry.value;
    }
  }
  return undefined;
}

function findFuel(normalizedText: string) {
  for (const entry of FUEL_HINTS) {
    if (entry.keywords.some((keyword) => containsWord(normalizedText, normalize(keyword)))) {
      return entry.value;
    }
  }
  return undefined;
}

function findTransmission(normalizedText: string) {
  for (const entry of TRANSMISSION_HINTS) {
    if (entry.keywords.some((keyword) => containsWord(normalizedText, normalize(keyword)))) {
      return entry.value;
    }
  }
  return undefined;
}

function findYear(rawText: string) {
  const currentYear = new Date().getFullYear() + 1;
  const matches = rawText.match(/\b(19[8-9]\d|20\d{2})\b/g);
  if (!matches) return undefined;
  for (const candidate of matches) {
    const year = Number(candidate);
    if (year >= 1980 && year <= currentYear) {
      return String(year);
    }
  }
  return undefined;
}

function findPrice(rawText: string, year: string | undefined) {
  const matches = [...rawText.matchAll(/(\d{3,7})(?:\s?(eur|mkd|€|ден|денари))?/gi)];
  for (const match of matches) {
    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount < 50) continue;
    if (year && match[1] === year) continue;
    return String(amount);
  }
  return undefined;
}

function findKilometers(rawText: string) {
  const match = rawText.match(/(\d{2,3}(?:[.,]\d{3})|\d{4,7})\s?(km|км)\b/i);
  if (!match) return undefined;
  return match[1].replace(/[.,]/g, "");
}

function findBrandAndModel(normalizedText: string) {
  const byAlias = CAR_BRANDS.flatMap((entry) =>
    entry.aliases.map((alias) => ({ alias: normalize(alias), brand: entry.brand, models: entry.models })),
  ).sort((a, b) => b.alias.length - a.alias.length);

  const aliasMatch = byAlias.find((entry) => containsWord(normalizedText, entry.alias));
  const matchedBrand = aliasMatch?.brand;
  const modelSource = aliasMatch?.models ?? CAR_BRANDS.flatMap((entry) => entry.models);
  const matchedModel = modelSource.find((model) => containsWord(normalizedText, normalize(model)));

  return {
    brand: matchedBrand,
    model: matchedModel
      ? matchedModel
          .split(" ")
          .map((segment) =>
            /^[0-9]+$/.test(segment)
              ? segment
              : `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`,
          )
          .join(" ")
      : undefined,
  };
}

function collectCategoryLabels(category: QuickFillCategoryInput) {
  const values = new Set<string>();
  values.add(category.name);
  values.add(category.slug.replace(/-/g, " "));

  for (const [key, value] of Object.entries(category)) {
    if (typeof value === "string" && /(name|label)/i.test(key)) {
      values.add(value);
    }
    if (value && typeof value === "object" && /(labels|translations|i18n)/i.test(key)) {
      Object.values(value as Record<string, unknown>).forEach((item) => {
        if (typeof item === "string") values.add(item);
      });
    }
  }

  return [...values];
}

function scoreCandidate(textTokens: string[], candidate: string) {
  const normalizedCandidate = normalize(candidate);
  if (!normalizedCandidate) return 0;
  const candidateTokens = normalizedCandidate.split(" ");
  let score = 0;
  for (const token of textTokens) {
    if (!token || token.length < 2) continue;
    if (candidateTokens.includes(token)) score += 4;
    else if (normalizedCandidate.includes(token)) score += 2;
  }
  return score;
}

function buildCategoryCandidates(
  normalizedText: string,
  categories: QuickFillCategoryInput[],
) {
  const tokens = tokenize(normalizedText);
  const scored = categories
    .map((category) => {
      const labels = collectCategoryLabels(category);
      const bestScore = labels.reduce(
        (max, label) => Math.max(max, scoreCandidate(tokens, label)),
        0,
      );
      const matchedLabel =
        labels.find((label) => normalize(label).includes(normalizedText)) ||
        labels[0] ||
        category.name;
      return { category, score: bestScore, matchedLabel };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return scored.map((item) => ({
    categoryId: item.category.id,
    label: item.matchedLabel,
    confidence: item.score >= 8 ? "high" : item.score >= 5 ? "medium" : "low",
  })) as QuickFillCategoryCandidate[];
}

function buildDescriptionTemplate(
  locale: QuickFillLocale,
  categoryLabel: string | undefined,
  condition: ListingCondition | undefined,
) {
  const conditionLabel =
    locale === "mk"
      ? condition === ListingCondition.NEW
        ? "ново"
        : condition === ListingCondition.REFURBISHED
          ? "рефурбиширано"
          : condition === ListingCondition.USED
            ? "користено"
            : "во добра состојба"
      : condition === ListingCondition.NEW
        ? "new"
        : condition === ListingCondition.REFURBISHED
          ? "refurbished"
          : condition === ListingCondition.USED
            ? "used"
            : "in good condition";

  if (locale === "mk") {
    return `Состојба: ${conditionLabel}. ${categoryLabel ? `Категорија: ${categoryLabel}. ` : ""}Контактирај за достапност и испорака.`;
  }

  return `Condition: ${conditionLabel}. ${categoryLabel ? `Category: ${categoryLabel}. ` : ""}Contact for availability and delivery details.`;
}

export function quickFillFromLine({
  text,
  locale,
  categories,
  cities,
}: {
  text: string;
  locale: QuickFillLocale;
  categories: QuickFillCategoryInput[];
  cities: QuickFillCityInput[];
}): QuickFillResult {
  const raw = text.trim();
  if (!raw) {
    return { suggestions: [], categoryCandidates: [] };
  }

  const normalized = normalize(raw);
  const year = findYear(raw);
  const price = findPrice(raw, year);
  const kilometers = findKilometers(raw);
  const condition = findCondition(normalized);
  const fuel = findFuel(normalized);
  const transmission = findTransmission(normalized);
  const { brand, model } = findBrandAndModel(normalized);

  const matchedCity = cities.find((city) => {
    const normalizedName = normalize(city.name);
    return (
      containsWord(normalized, normalizedName) ||
      normalizedName.split(" ").some((part) => part.length > 2 && containsWord(normalized, part))
    );
  });

  const categoryCandidates = buildCategoryCandidates(normalized, categories);
  const primaryCategoryLabel = categoryCandidates[0]?.label;

  const hasCarSignals = Boolean(brand || model || fuel || transmission || kilometers);
  if (hasCarSignals) {
    const carsCandidate = categories.find((category) => category.slug === "cars");
    if (carsCandidate && !categoryCandidates.some((entry) => entry.categoryId === carsCandidate.id)) {
      categoryCandidates.unshift({
        categoryId: carsCandidate.id,
        label: carsCandidate.name,
        confidence: containsWord(normalized, "car") || containsWord(normalized, "авто")
          ? "medium"
          : "low",
      });
    }
  }

  const suggestions: QuickFillSuggestion[] = [];

  if (brand) suggestions.push({ field: "brand", value: brand, confidence: "medium" });
  if (model) suggestions.push({ field: "model", value: model, confidence: "medium" });
  if (year) suggestions.push({ field: "year", value: year, confidence: "high" });
  if (condition) {
    suggestions.push({ field: "condition", value: condition, confidence: "high", condition });
  }
  if (matchedCity) {
    suggestions.push({
      field: "city",
      value: matchedCity.name,
      confidence: "high",
      cityId: matchedCity.id,
    });
  }
  if (price) suggestions.push({ field: "price", value: price, confidence: "medium" });
  if (fuel) suggestions.push({ field: "fuel", value: fuel, confidence: "medium" });
  if (transmission) {
    suggestions.push({ field: "transmission", value: transmission, confidence: "medium" });
  }
  if (kilometers) {
    suggestions.push({ field: "kilometers", value: kilometers, confidence: "high" });
  }

  const description = buildDescriptionTemplate(locale, primaryCategoryLabel, condition);
  if (description) {
    suggestions.push({
      field: "description",
      value: description,
      confidence: "low",
    });
  }

  return {
    suggestions,
    categoryCandidates: categoryCandidates.slice(0, 4),
  };
}
