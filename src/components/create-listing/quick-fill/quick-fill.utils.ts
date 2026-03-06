import type { QuickFillSuggestion } from "@/lib/quick-fill";

export function normalizeCreateQuickSearchText(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreCreateQuickSearchField(
  field: string,
  normalizedQuery: string,
  queryTokens: string[],
) {
  if (!field) return 0;
  if (field === normalizedQuery) return 120;
  if (field.startsWith(normalizedQuery)) return 95;
  if (field.includes(` ${normalizedQuery}`)) return 88;
  if (field.includes(normalizedQuery)) return 76;
  if (
    queryTokens.length > 1 &&
    queryTokens.every((token) => field.includes(token))
  ) {
    return 68 + Math.min(queryTokens.length, 5);
  }
  return 0;
}

export function resolveCreateQuickConfidenceLabel(
  confidence: "high" | "medium" | "low",
  labels: { high: string; medium: string; low: string },
) {
  if (confidence === "high") return labels.high;
  if (confidence === "medium") return labels.medium;
  return labels.low;
}

export function resolveCreateQuickSuggestionLabel(
  suggestion: QuickFillSuggestion,
  labels: {
    brand: string;
    model: string;
    year: string;
    condition: string;
    city: string;
    price: string;
    fuel: string;
    transmission: string;
    kilometers: string;
    description: string;
  },
) {
  if (suggestion.field === "brand") return labels.brand;
  if (suggestion.field === "model") return labels.model;
  if (suggestion.field === "year") return labels.year;
  if (suggestion.field === "condition") return labels.condition;
  if (suggestion.field === "city") return labels.city;
  if (suggestion.field === "price") return labels.price;
  if (suggestion.field === "fuel") return labels.fuel;
  if (suggestion.field === "transmission") return labels.transmission;
  if (suggestion.field === "kilometers") return labels.kilometers;
  return labels.description;
}
