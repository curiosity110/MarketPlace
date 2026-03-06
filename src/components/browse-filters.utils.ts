import type {
  BrowseFilterState,
  BrowseSort,
  BrowseTemplate,
} from "@/components/browse-filters.types";

export const TYPING_DEBOUNCE_MS = 320;
const CLEAN_QUERY_KEYS = new Set([
  "q",
  "cat",
  "sub",
  "city",
  "condition",
  "cond",
  "make",
  "model",
  "yearFrom",
  "yearTo",
  "fav",
  "min",
  "max",
  "sort",
  "page",
]);

export const EMPTY_BROWSE_FILTER_STATE: BrowseFilterState = {
  q: "",
  cat: "",
  sub: "",
  city: "",
  condition: "",
  make: "",
  model: "",
  yearFrom: "",
  yearTo: "",
  fav: "",
  min: "",
  max: "",
  sort: "newest",
};

export function parseBrowseSort(value: string | null): BrowseSort {
  if (value === "price-asc" || value === "price-desc") return value;
  return "newest";
}

export function getBrowseFilterState(sp: URLSearchParams): BrowseFilterState {
  return {
    q: sp.get("q") ?? "",
    cat: sp.get("cat") ?? "",
    sub: sp.get("sub") ?? "",
    city: sp.get("city") ?? "",
    condition: sp.get("condition") ?? sp.get("cond") ?? "",
    make: sp.get("make") ?? "",
    model: sp.get("model") ?? "",
    yearFrom: sp.get("yearFrom") ?? "",
    yearTo: sp.get("yearTo") ?? "",
    fav: sp.get("fav") === "1" ? "1" : "",
    min: sp.get("min") ?? "",
    max: sp.get("max") ?? "",
    sort: parseBrowseSort(sp.get("sort")),
  };
}

export function getBrowseDynamicValues(sp: URLSearchParams) {
  const values: Record<string, string> = {};
  for (const [key, value] of sp.entries()) {
    if (!key.startsWith("df_")) continue;
    values[key.slice(3)] = value;
  }
  return values;
}

export function isCarsSlug(slug: string | undefined) {
  if (!slug) return false;
  const normalized = slug.toLowerCase();
  return normalized === "cars" || normalized.includes("car");
}

export function isCarCoreTemplate(template: BrowseTemplate) {
  const source = `${template.key} ${template.label}`.toLowerCase();
  return /(brand|make|manufacturer|model|year|fuel|transmission|gearbox|km|mileage|kilomet)/.test(
    source,
  );
}

export function isCarExtraTemplate(template: BrowseTemplate) {
  const source = `${template.key} ${template.label}`.toLowerCase();
  return /(fuel|transmission|gearbox|km|mileage|kilomet)/.test(source);
}

export function isCarIdentityTemplate(template: BrowseTemplate) {
  const source = `${template.key} ${template.label}`.toLowerCase();
  return /(brand|make|manufacturer|model|year)/.test(source);
}

export function normalizeNumericInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function toPositiveInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed);
}

export function normalizeMinMax(minValue: string, maxValue: string) {
  const minInt = toPositiveInteger(minValue);
  const maxInt = toPositiveInteger(maxValue);

  if (minInt !== undefined && maxInt !== undefined && minInt > maxInt) {
    return {
      min: String(maxInt),
      max: String(minInt),
      hasSwap: true,
    };
  }

  return {
    min: minInt === undefined ? "" : String(minInt),
    max: maxInt === undefined ? "" : String(maxInt),
    hasSwap: false,
  };
}

export function areBrowseStatesEqual(a: BrowseFilterState, b: BrowseFilterState) {
  return (
    a.q === b.q &&
    a.cat === b.cat &&
    a.sub === b.sub &&
    a.city === b.city &&
    a.condition === b.condition &&
    a.make === b.make &&
    a.model === b.model &&
    a.yearFrom === b.yearFrom &&
    a.yearTo === b.yearTo &&
    a.fav === b.fav &&
    a.min === b.min &&
    a.max === b.max &&
    a.sort === b.sort
  );
}

export function areStringRecordsEqual(
  a: Record<string, string>,
  b: Record<string, string>,
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export function canonicalizeQueryString(input: string) {
  const entries = [...new URLSearchParams(input).entries()].sort((left, right) => {
    if (left[0] === right[0]) return left[1].localeCompare(right[1]);
    return left[0].localeCompare(right[0]);
  });
  return new URLSearchParams(entries).toString();
}

export function canonicalizeWithoutPage(input: string) {
  const params = new URLSearchParams(input);
  params.delete("page");
  return canonicalizeQueryString(params.toString());
}

export function hasAnyBrowseFilter(
  state: BrowseFilterState,
  dynamicValues: Record<string, string>,
) {
  const dynamicHasValue = Object.values(dynamicValues).some(
    (value) => value.trim().length > 0,
  );
  return (
    Boolean(state.q.trim()) ||
    Boolean(state.cat) ||
    Boolean(state.sub) ||
    Boolean(state.city) ||
    Boolean(state.condition) ||
    Boolean(state.make) ||
    Boolean(state.model) ||
    Boolean(state.yearFrom) ||
    Boolean(state.yearTo) ||
    state.fav === "1" ||
    Boolean(state.min.trim()) ||
    Boolean(state.max.trim()) ||
    state.sort !== "newest" ||
    dynamicHasValue
  );
}

export function buildBrowseQueryFromState(
  baseQueryString: string,
  state: BrowseFilterState,
  dynamicValues: Record<string, string>,
) {
  const normalizedRange = normalizeMinMax(state.min, state.max);
  const params = new URLSearchParams(baseQueryString);

  [...params.keys()].forEach((key) => {
    if (CLEAN_QUERY_KEYS.has(key) || key.startsWith("df_")) {
      params.delete(key);
    }
  });

  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.cat) params.set("cat", state.cat);
  if (state.sub) params.set("sub", state.sub);
  if (state.city) params.set("city", state.city);
  if (state.condition) params.set("condition", state.condition);
  if (state.make) params.set("make", state.make);
  if (state.model) params.set("model", state.model);
  if (state.yearFrom) params.set("yearFrom", state.yearFrom);
  if (state.yearTo) params.set("yearTo", state.yearTo);
  if (state.fav === "1") params.set("fav", "1");
  if (normalizedRange.min) params.set("min", normalizedRange.min);
  if (normalizedRange.max) params.set("max", normalizedRange.max);
  if (state.sort !== "newest") params.set("sort", state.sort);

  Object.entries(dynamicValues).forEach(([key, value]) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    params.set(`df_${key}`, trimmed);
  });

  const hasFilters =
    Boolean(state.q.trim()) ||
    Boolean(state.cat) ||
    Boolean(state.sub) ||
    Boolean(state.city) ||
    Boolean(state.condition) ||
    Boolean(state.make) ||
    Boolean(state.model) ||
    Boolean(state.yearFrom) ||
    Boolean(state.yearTo) ||
    state.fav === "1" ||
    Boolean(normalizedRange.min) ||
    Boolean(normalizedRange.max) ||
    state.sort !== "newest" ||
    Object.values(dynamicValues).some((value) => value.trim().length > 0);

  if (hasFilters) {
    params.set("page", "1");
  }

  return {
    query: params.toString(),
    normalizedRange,
  };
}

export function shouldSkipBrowseNavigation(
  nextQueryString: string,
  currentQueryString: string,
) {
  const nextCanonical = canonicalizeQueryString(nextQueryString);
  const currentCanonical = canonicalizeQueryString(currentQueryString);
  if (nextCanonical === currentCanonical) return true;

  const nextCanonicalWithoutPage = canonicalizeWithoutPage(nextQueryString);
  const currentCanonicalWithoutPage = canonicalizeWithoutPage(currentQueryString);
  return nextCanonicalWithoutPage === currentCanonicalWithoutPage;
}
