import type { BrowseSort } from "@/app/browse/browse-page.types";

export function buildBrowseBaseParams(
  params: Record<string, string | string[] | undefined>,
) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const single = Array.isArray(value) ? value[0] : value;
    if (!single || key === "page") return;
    next.set(key, single);
  });
  return next;
}

export function buildBrowsePageHref(baseParams: URLSearchParams, page: number) {
  const next = new URLSearchParams(baseParams.toString());
  next.set("page", String(page));
  return `/browse?${next.toString()}`;
}

export function getBrowseParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseOptionalNumberParam(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseBrowseSort(value: string | undefined): BrowseSort {
  if (value === "price-asc" || value === "price-desc") return value;
  return "newest";
}

export function parseOptionalYearParam(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}$/.test(trimmed)) return undefined;
  const year = Number(trimmed);
  const currentYear = new Date().getFullYear() + 1;
  if (!Number.isFinite(year) || year < 1950 || year > currentYear) return undefined;
  return year;
}

export function isCarsSlug(slug: string | undefined) {
  if (!slug) return false;
  const normalized = slug.toLowerCase();
  return normalized === "cars" || normalized.includes("car");
}
