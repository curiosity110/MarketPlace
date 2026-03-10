const STORAGE_KEY = "marketplace_recently_viewed";
const MAX_IDS = 5;

export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(listingId: string): void {
  if (typeof window === "undefined" || !listingId) return;
  const ids = getRecentlyViewedIds().filter((id) => id !== listingId);
  ids.unshift(listingId);
  const trimmed = ids.slice(0, MAX_IDS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}
