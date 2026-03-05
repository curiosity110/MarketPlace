export type CreateListingHrefValue =
  | string
  | number
  | null
  | undefined
  | false;

export function buildCreateListingHref(
  params?: Record<string, CreateListingHrefValue>,
) {
  if (!params) return "?create=1";

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "closed") continue;
    if (value === null || value === undefined || value === false) continue;
    const normalized = String(value).trim();
    if (!normalized) continue;
    search.set(key, normalized);
  }

  if (!search.has("create")) {
    search.set("create", "1");
  }

  const query = search.toString();
  return query ? `?${query}` : "?create=1";
}
