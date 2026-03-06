import type {
  DashboardFilterState,
  DashboardListingItem,
  DashboardStatusFilterItem,
  DashboardView,
} from "@/features/dashboard/types";
import { localizeCategoryName } from "@/lib/category-label";

export function countDashboardListingsByView(
  items: DashboardListingItem[],
  view: DashboardView,
) {
  if (view === "sold") return items.filter((item) => Boolean(item.sale)).length;
  if (view === "active") {
    return items.filter((item) => item.status === "ACTIVE" && !item.sale).length;
  }
  if (view === "draft") {
    return items.filter((item) => item.status === "DRAFT" && !item.sale).length;
  }
  if (view === "expired") {
    return items.filter((item) => item.status === "INACTIVE" && !item.sale).length;
  }
  return items.length;
}

export function buildDashboardStatusItems(
  items: DashboardListingItem[],
  text: {
    all: string;
    active: string;
    draft: string;
    expired: string;
    sold: string;
  },
): DashboardStatusFilterItem[] {
  return [
    { key: "all", label: text.all, count: items.length },
    { key: "active", label: text.active, count: countDashboardListingsByView(items, "active") },
    { key: "draft", label: text.draft, count: countDashboardListingsByView(items, "draft") },
    { key: "expired", label: text.expired, count: countDashboardListingsByView(items, "expired") },
    { key: "sold", label: text.sold, count: countDashboardListingsByView(items, "sold") },
  ];
}

export function filterDashboardListings(
  items: DashboardListingItem[],
  filters: DashboardFilterState,
  locale: "en" | "mk",
) {
  const q = filters.q.trim().toLowerCase();

  const byStatus = items.filter((listing) => {
    if (filters.view === "sold") return Boolean(listing.sale);
    if (filters.view === "active") return listing.status === "ACTIVE" && !listing.sale;
    if (filters.view === "draft") return listing.status === "DRAFT" && !listing.sale;
    if (filters.view === "expired") return listing.status === "INACTIVE" && !listing.sale;
    return true;
  });

  const bySearch = byStatus.filter((listing) => {
    if (!q) return true;
    const categoryName = localizeCategoryName(listing.category, locale).toLowerCase();
    return (
      listing.title.toLowerCase().includes(q) ||
      listing.city.name.toLowerCase().includes(q) ||
      categoryName.includes(q)
    );
  });

  return [...bySearch].sort((a, b) => {
    if (filters.sort === "price-asc") return a.priceCents - b.priceCents;
    if (filters.sort === "price-desc") return b.priceCents - a.priceCents;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
