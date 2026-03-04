import { ListingCondition } from "@prisma/client";

type Locale = "en" | "mk";

export type SmartFillSuggestions = {
  suggestedBrand?: string;
  suggestedModel?: string;
  suggestedYear?: string;
  suggestedCondition?: ListingCondition;
  suggestedTitle?: string;
  suggestedDescription?: string;
};

type BrandDictionaryItem = {
  brand: string;
  aliases: string[];
  models: string[];
};

const BRAND_DICTIONARY: BrandDictionaryItem[] = [
  {
    brand: "Audi",
    aliases: ["audi"],
    models: ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
  },
  {
    brand: "BMW",
    aliases: ["bmw"],
    models: ["1 Series", "3 Series", "5 Series", "X1", "X3", "X5"],
  },
  {
    brand: "Mercedes-Benz",
    aliases: ["mercedes", "mercedes benz", "mercedes-benz", "benz"],
    models: ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "GLE"],
  },
  {
    brand: "Volkswagen",
    aliases: ["volkswagen", "vw"],
    models: ["Golf", "Passat", "Polo", "Tiguan", "Touareg"],
  },
  {
    brand: "Opel",
    aliases: ["opel"],
    models: ["Astra", "Corsa", "Insignia", "Mokka"],
  },
  {
    brand: "Ford",
    aliases: ["ford"],
    models: ["Fiesta", "Focus", "Mondeo", "Kuga"],
  },
  {
    brand: "Skoda",
    aliases: ["skoda", "škoda"],
    models: ["Fabia", "Octavia", "Superb", "Kodiaq"],
  },
  {
    brand: "Toyota",
    aliases: ["toyota"],
    models: ["Yaris", "Corolla", "Auris", "RAV4"],
  },
  {
    brand: "Hyundai",
    aliases: ["hyundai"],
    models: ["i10", "i20", "i30", "Tucson", "Santa Fe"],
  },
  {
    brand: "Kia",
    aliases: ["kia"],
    models: ["Rio", "Ceed", "Sportage", "Sorento"],
  },
  {
    brand: "Renault",
    aliases: ["renault"],
    models: ["Clio", "Megane", "Captur", "Kadjar"],
  },
  {
    brand: "Peugeot",
    aliases: ["peugeot"],
    models: ["208", "308", "3008", "5008"],
  },
];

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasToken(source: string, token: string) {
  const normalizedSource = normalizeText(source);
  const normalizedToken = normalizeText(token);
  if (!normalizedSource || !normalizedToken) return false;
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedToken)}(\\s|$)`, "i");
  return pattern.test(normalizedSource);
}

function findBrand(normalizedTitle: string) {
  const aliasEntries = BRAND_DICTIONARY.flatMap((item) =>
    item.aliases.map((alias) => ({ alias, brand: item.brand })),
  ).sort((a, b) => b.alias.length - a.alias.length);

  const match = aliasEntries.find((entry) =>
    hasToken(normalizedTitle, entry.alias),
  );
  return match?.brand;
}

function findModel(normalizedTitle: string, brand: string | undefined) {
  const scoped = brand
    ? BRAND_DICTIONARY.find((item) => item.brand === brand)?.models ?? []
    : BRAND_DICTIONARY.flatMap((item) => item.models);

  const sorted = [...scoped].sort((a, b) => b.length - a.length);
  return sorted.find((model) => hasToken(normalizedTitle, model));
}

function findYear(title: string) {
  const currentYear = new Date().getFullYear();
  const matches = title.match(/\b(19[8-9]\d|20\d{2})\b/g);
  if (!matches) return undefined;

  for (const candidate of matches) {
    const year = Number(candidate);
    if (year >= 1980 && year <= currentYear + 1) {
      return String(year);
    }
  }
  return undefined;
}

function findCondition(normalizedTitle: string) {
  if (
    /(\brefurbished\b|\brenewed\b|\breconditioned\b|рефурб|реновиран|rekondicioniran)/i.test(
      normalizedTitle,
    )
  ) {
    return ListingCondition.REFURBISHED;
  }

  if (
    /(\bbrand new\b|\bnew\b|\bnovo\b|ново|неупотребуван|некористен)/i.test(
      normalizedTitle,
    )
  ) {
    return ListingCondition.NEW;
  }

  if (
    /(\bused\b|\bsecond hand\b|\bpre owned\b|\bpre-owned\b|\bpolovno\b|користен|половен|како нов|\blike new\b)/i.test(
      normalizedTitle,
    )
  ) {
    return ListingCondition.USED;
  }

  return undefined;
}

function cleanTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildSuggestedTitle(
  title: string,
  brand: string | undefined,
  model: string | undefined,
  year: string | undefined,
) {
  const base = cleanTitle(title);
  if (!base) return undefined;

  let next = base;
  if (brand && !hasToken(next, brand)) next = `${brand} ${next}`;
  if (model && !hasToken(next, model)) next = `${next} ${model}`;
  if (year && !new RegExp(`\\b${escapeRegExp(year)}\\b`).test(next)) {
    next = `${next} ${year}`;
  }

  const normalizedNext = cleanTitle(next);
  return normalizedNext !== base ? normalizedNext : undefined;
}

function conditionLabel(condition: ListingCondition | undefined, locale: Locale) {
  if (!condition) return locale === "mk" ? "користено" : "used";
  if (locale === "mk") {
    if (condition === ListingCondition.NEW) return "ново";
    if (condition === ListingCondition.REFURBISHED) return "рефурбиширано";
    return "користено";
  }
  if (condition === ListingCondition.NEW) return "new";
  if (condition === ListingCondition.REFURBISHED) return "refurbished";
  return "used";
}

function buildSuggestedDescription(
  locale: Locale,
  brand: string | undefined,
  model: string | undefined,
  year: string | undefined,
  condition: ListingCondition | undefined,
) {
  if (!brand && !model && !year && !condition) return undefined;

  const itemName = [brand, model].filter(Boolean).join(" ").trim() || (locale === "mk" ? "производ" : "item");
  const yearPart = year ? (locale === "mk" ? ` (${year})` : ` (${year})`) : "";
  const conditionPart = conditionLabel(condition, locale);

  if (locale === "mk") {
    return `Се продава ${conditionPart} ${itemName}${yearPart}. Контактирај за повеќе детали, достапност и испорака.`;
  }

  return `Selling a ${conditionPart} ${itemName}${yearPart}. Contact for details, availability, and delivery options.`;
}

export function smartFillFromTitle(
  title: string,
  locale: Locale,
): SmartFillSuggestions {
  const cleanedTitle = cleanTitle(title);
  if (!cleanedTitle) return {};

  const normalizedTitle = normalizeText(cleanedTitle);
  const suggestedBrand = findBrand(normalizedTitle);
  const suggestedModel = findModel(normalizedTitle, suggestedBrand);
  const suggestedYear = findYear(cleanedTitle);
  const suggestedCondition = findCondition(normalizedTitle);
  const suggestedTitle = buildSuggestedTitle(
    cleanedTitle,
    suggestedBrand,
    suggestedModel,
    suggestedYear,
  );
  const suggestedDescription = buildSuggestedDescription(
    locale,
    suggestedBrand,
    suggestedModel,
    suggestedYear,
    suggestedCondition,
  );

  return {
    suggestedBrand,
    suggestedModel,
    suggestedYear,
    suggestedCondition,
    suggestedTitle,
    suggestedDescription,
  };
}

