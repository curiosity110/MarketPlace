export type CreateListingHrefValue =
  | string
  | number
  | null
  | undefined
  | false;

export function buildCreateListingHref(
  params?: Record<string, CreateListingHrefValue>,
) {
  if (!params) return "/sell";

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === false) continue;
    const normalized = String(value).trim();
    if (!normalized) continue;
    search.set(key, normalized);
  }

  const query = search.toString();
  return query ? `/sell?${query}` : "/sell";
}
