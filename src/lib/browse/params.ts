type SearchParamsRecord = Record<string, string | string[] | undefined>;

const MODE_SIMILAR = "similar";

export const BROWSE_SIMILARITY_BASE_KEYS = [
  "mode",
  "seed",
  "make",
  "model",
  "yearFrom",
  "yearTo",
  "min",
  "max",
  "city",
  "fuel",
  "transmission",
] as const;

export const BROWSE_EXCLUSION_KEYS = [
  "notMake",
  "notModel",
  "notFuel",
  "notTransmission",
  "notCity",
] as const;

export const BROWSE_SIMILARITY_CLEAR_KEYS = [
  ...BROWSE_SIMILARITY_BASE_KEYS,
  ...BROWSE_EXCLUSION_KEYS,
] as const;

export type BrowseSimilarityQuery = {
  mode?: typeof MODE_SIMILAR;
  seed?: string;
  fuel?: string;
  transmission?: string;
  notMake?: string;
  notModel?: string;
  notFuel?: string;
  notTransmission?: string;
  notCity?: string;
};

function getParam(
  source: URLSearchParams | SearchParamsRecord,
  key: string,
): string | undefined {
  if (source instanceof URLSearchParams) {
    const value = source.get(key);
    return value === null ? undefined : value;
  }
  const value = source[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeSlug(value: string | undefined) {
  const trimmed = (value || "").trim().toLowerCase();
  if (!trimmed) return undefined;
  if (!/^[a-z0-9-]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function normalizeToken(value: string | undefined, maxLength: number) {
  const trimmed = (value || "").trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) return undefined;
  return trimmed;
}

function normalizeText(value: string | undefined, maxLength: number) {
  const trimmed = (value || "").trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) return undefined;
  return trimmed;
}

export function parseBrowseSimilarityQuery(
  source: URLSearchParams | SearchParamsRecord,
): BrowseSimilarityQuery {
  const mode = getParam(source, "mode");
  const seed = normalizeToken(getParam(source, "seed"), 64);
  const fuel = normalizeText(getParam(source, "fuel"), 64);
  const transmission = normalizeText(getParam(source, "transmission"), 64);
  const notMake = normalizeSlug(getParam(source, "notMake"));
  const notModel = normalizeSlug(getParam(source, "notModel"));
  const notFuel = normalizeText(getParam(source, "notFuel"), 64);
  const notTransmission = normalizeText(getParam(source, "notTransmission"), 64);
  const notCity = normalizeToken(getParam(source, "notCity"), 64);

  return {
    ...(mode === MODE_SIMILAR ? { mode } : {}),
    ...(seed ? { seed } : {}),
    ...(fuel ? { fuel } : {}),
    ...(transmission ? { transmission } : {}),
    ...(notMake ? { notMake } : {}),
    ...(notModel ? { notModel } : {}),
    ...(notFuel ? { notFuel } : {}),
    ...(notTransmission ? { notTransmission } : {}),
    ...(notCity ? { notCity } : {}),
  };
}

export function toBrowseHref(source: URLSearchParams | string) {
  const params =
    typeof source === "string" ? new URLSearchParams(source) : source;
  const query = params.toString();
  return query ? `/browse?${query}` : "/browse";
}

export function patchBrowseParams(
  base: URLSearchParams | string,
  options: {
    clear?: readonly string[];
    set?: Record<string, string | null | undefined>;
    resetPage?: boolean;
  },
) {
  const params =
    typeof base === "string" ? new URLSearchParams(base) : new URLSearchParams(base.toString());

  (options.clear || []).forEach((key) => params.delete(key));
  Object.entries(options.set || {}).forEach(([key, value]) => {
    const trimmed = typeof value === "string" ? value.trim() : value;
    if (!trimmed) {
      params.delete(key);
      return;
    }
    params.set(key, trimmed);
  });

  if (options.resetPage ?? true) {
    params.set("page", "1");
  }

  return toBrowseHref(params);
}
