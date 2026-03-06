export type DashboardView = "all" | "active" | "draft" | "expired" | "sold";
export type DashboardSort = "newest" | "price-asc" | "price-desc";
export type DashboardLayout = "grid" | "list";

export type DashboardCategoryFilterItem = {
  id: string;
  label: string;
  count: number;
};

export type DashboardStatusFilterItem = {
  key: DashboardView;
  label: string;
  count: number;
};

export type DashboardFilterState = {
  cat: string;
  view: DashboardView;
  q: string;
  sort: DashboardSort;
  layout: DashboardLayout;
};

export type DashboardListingItem = {
  id: string;
  title: string;
  status: string;
  priceCents: number;
  currency: string;
  categoryId: string;
  updatedAt: string;
  activeUntil: string | null;
  category: {
    id: string;
    name: string;
    slug: string | null;
  };
  city: {
    id: string;
    name: string;
  };
  images: { url: string }[];
  sale: {
    soldAt: string;
  } | null;
};
