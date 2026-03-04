const MIN_YEAR = 1980;
const YEAR_BAND = 2;
const PRICE_BAND_RATIO = 0.15;

export const CAR_FUEL_FIELD_KEYS = ["fuel", "fuel_type"] as const;
export const CAR_TRANSMISSION_FIELD_KEYS = [
  "transmission",
  "gearbox",
] as const;

type DynamicFieldEntry = {
  key: string;
  value: string;
};

type SimilarityListingSource = {
  id: string;
  carMake?: { slug?: string | null } | null;
  carModel?: { slug?: string | null } | null;
  carYear?: number | null;
  priceCents?: number | null;
  city?: { id?: string | null } | null;
  fieldValues?: DynamicFieldEntry[];
};

function normalizeSlug(value: string | null | undefined) {
  const trimmed = (value || "").trim().toLowerCase();
  if (!trimmed) return undefined;
  return trimmed;
}

function normalizePlainValue(value: string | null | undefined) {
  const trimmed = (value || "").trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function pickDynamicValue(
  fieldValues: DynamicFieldEntry[] | undefined,
  keys: readonly string[],
) {
  if (!fieldValues || fieldValues.length === 0) return undefined;
  const valueByKey = new Map(
    fieldValues.map((entry) => [entry.key.toLowerCase(), entry.value]),
  );
  for (const key of keys) {
    const value = normalizePlainValue(valueByKey.get(key.toLowerCase()));
    if (value) return value;
  }
  return undefined;
}

function priceBandFromCents(priceCents: number | null | undefined) {
  if (!priceCents || priceCents <= 0) return {};
  const minCents = Math.max(1, Math.floor(priceCents * (1 - PRICE_BAND_RATIO)));
  const maxCents = Math.ceil(priceCents * (1 + PRICE_BAND_RATIO));

  const min = Math.max(1, Math.floor(minCents / 100));
  const max = Math.max(min, Math.ceil(maxCents / 100));
  return { min: String(min), max: String(max) };
}

function yearBand(year: number | null | undefined) {
  if (!year || !Number.isFinite(year)) return {};
  const currentYear = new Date().getFullYear() + 1;
  const normalizedYear = Math.round(year);
  if (normalizedYear < MIN_YEAR || normalizedYear > currentYear) return {};

  return {
    yearFrom: String(Math.max(MIN_YEAR, normalizedYear - YEAR_BAND)),
    yearTo: String(Math.min(currentYear, normalizedYear + YEAR_BAND)),
  };
}

export function buildSimilarityParams(listing: SimilarityListingSource) {
  const make = normalizeSlug(listing.carMake?.slug);
  const model = normalizeSlug(listing.carModel?.slug);
  const fuel = pickDynamicValue(listing.fieldValues, CAR_FUEL_FIELD_KEYS);
  const transmission = pickDynamicValue(
    listing.fieldValues,
    CAR_TRANSMISSION_FIELD_KEYS,
  );
  const cityId = normalizePlainValue(listing.city?.id);
  const year = yearBand(listing.carYear);
  const price = priceBandFromCents(listing.priceCents);

  return {
    mode: "similar",
    seed: listing.id,
    ...(make ? { make } : {}),
    ...(model ? { model } : {}),
    ...(cityId ? { city: cityId } : {}),
    ...(fuel ? { fuel } : {}),
    ...(transmission ? { transmission } : {}),
    ...year,
    ...price,
  } as const;
}

export function buildExclusionParams(listing: SimilarityListingSource) {
  const make = normalizeSlug(listing.carMake?.slug);
  const model = normalizeSlug(listing.carModel?.slug);
  const fuel = pickDynamicValue(listing.fieldValues, CAR_FUEL_FIELD_KEYS);
  const transmission = pickDynamicValue(
    listing.fieldValues,
    CAR_TRANSMISSION_FIELD_KEYS,
  );
  const cityId = normalizePlainValue(listing.city?.id);

  return {
    ...(make ? { notMake: make } : {}),
    ...(model ? { notModel: model } : {}),
    ...(fuel ? { notFuel: fuel } : {}),
    ...(transmission ? { notTransmission: transmission } : {}),
    ...(cityId ? { notCity: cityId } : {}),
  } as const;
}
