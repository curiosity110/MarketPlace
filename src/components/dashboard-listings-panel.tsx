"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { localizeCategoryName } from "@/lib/category-label";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { DashboardFilterBar } from "@/components/dashboard-filter-bar";
import {
  DashboardListingCard,
  type DashboardListingItem,
} from "@/components/dashboard-listing-card";

type ListingView = "all" | "active" | "draft" | "expired" | "sold";
type ListingSort = "newest" | "price-asc" | "price-desc";
type ListingLayout = "grid" | "list";

type Props = {
  locale: "mk" | "en";
  text: {
    myCategories: string;
    myCategoriesDesc: string;
    noCategoryActivity: string;
    allCategories: string;
    all: string;
    active: string;
    draft: string;
    expired: string;
    sold: string;
    listings: string;
    results: string;
    createNow: string;
    createFirstListing: string;
    emptyListingsTitle: string;
    emptyListingsHint: string;
    filtersTitle: string;
    categoriesLabel: string;
    statusLabel: string;
    searchLabel: string;
    searchPlaceholder: string;
    clearSearch: string;
    sortLabel: string;
    sortNewest: string;
    sortPriceLowHigh: string;
    sortPriceHighLow: string;
    viewMode: string;
    gridView: string;
    listView: string;
    status: string;
    statusActive: string;
    statusDraft: string;
    statusExpired: string;
    statusSold: string;
    updated: string;
    ends: string;
    soldOn: string;
    edit: string;
    view: string;
    payAndPublish: string;
    openEditHint: string;
    expiredHint: string;
    soldHint: string;
    publishFree: string;
    firstPublishFreeHint: string;
    publishWithSubscription: string;
    subscriptionPublishHint: string;
  };
  allListings: DashboardListingItem[];
  initialFilters: {
    cat: string;
    view: ListingView;
    q: string;
    sort: ListingSort;
    layout: ListingLayout;
  };
  requiresPaymentForCreate: boolean;
  hasActiveSubscription: boolean;
  publishDraftAction: (formData: FormData) => void | Promise<void>;
};

function countByView(items: DashboardListingItem[], view: ListingView) {
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

export function DashboardListingsPanel({
  locale,
  text,
  allListings,
  initialFilters,
  requiresPaymentForCreate,
  hasActiveSubscription,
  publishDraftAction,
}: Props) {
  const userCategories = React.useMemo(() => {
    const grouped = new Map<
      string,
      { id: string; label: string; posted: number; active: number; draft: number; expired: number; sold: number }
    >();

    for (const listing of allListings) {
      const current = grouped.get(listing.category.id) || {
        id: listing.category.id,
        label: localizeCategoryName(listing.category, locale),
        posted: 0,
        active: 0,
        draft: 0,
        expired: 0,
        sold: 0,
      };
      current.posted += 1;
      if (listing.sale) {
        current.sold += 1;
      } else if (listing.status === "ACTIVE") {
        current.active += 1;
      } else if (listing.status === "DRAFT") {
        current.draft += 1;
      } else {
        current.expired += 1;
      }
      grouped.set(listing.category.id, current);
    }

    return [...grouped.values()].sort((a, b) => b.posted - a.posted);
  }, [allListings, locale]);

  const validCategoryIds = React.useMemo(
    () => new Set(userCategories.map((category) => category.id)),
    [userCategories],
  );

  const [filters, setFilters] = React.useState(() => ({
    cat:
      initialFilters.cat && initialFilters.cat !== "all" && validCategoryIds.has(initialFilters.cat)
        ? initialFilters.cat
        : "all",
    view: initialFilters.view,
    q: initialFilters.q,
    sort: initialFilters.sort,
    layout: initialFilters.layout,
  }));

  React.useEffect(() => {
    setFilters((prev) => {
      if (prev.cat === "all" || validCategoryIds.has(prev.cat)) return prev;
      return { ...prev, cat: "all" };
    });
  }, [validCategoryIds]);

  const preservedParamsRef = React.useRef<URLSearchParams | null>(null);
  React.useEffect(() => {
    if (preservedParamsRef.current !== null) return;
    const params = new URLSearchParams(window.location.search);
    ["cat", "view", "q", "sort", "layout"].forEach((key) => params.delete(key));
    preservedParamsRef.current = params;
  }, []);

  React.useEffect(() => {
    if (!preservedParamsRef.current) return;
    const params = new URLSearchParams(preservedParamsRef.current.toString());
    params.set("cat", filters.cat);
    params.set("view", filters.view);
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (filters.layout !== "grid") params.set("layout", filters.layout);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/dashboard?${query}` : "/dashboard");
  }, [filters]);

  const selectedCategory =
    filters.cat !== "all"
      ? userCategories.find((category) => category.id === filters.cat) || null
      : null;

  const categoryScopedListings = React.useMemo(
    () =>
      selectedCategory
        ? allListings.filter((listing) => listing.categoryId === selectedCategory.id)
        : allListings,
    [allListings, selectedCategory],
  );

  const statusCounts = React.useMemo(
    () => ({
      all: categoryScopedListings.length,
      active: countByView(categoryScopedListings, "active"),
      draft: countByView(categoryScopedListings, "draft"),
      expired: countByView(categoryScopedListings, "expired"),
      sold: countByView(categoryScopedListings, "sold"),
    }),
    [categoryScopedListings],
  );

  const filteredListings = React.useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    const byStatus = categoryScopedListings.filter((listing) => {
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
  }, [categoryScopedListings, filters.q, filters.sort, filters.view, locale]);

  const categoryItems = [
    {
      id: "all",
      label: text.allCategories,
      count: allListings.length,
    },
    ...userCategories.map((category) => ({
      id: category.id,
      label: category.label,
      count: category.posted,
    })),
  ];
  const statusItems: Array<{ key: ListingView; label: string; count: number }> = [
    { key: "all", label: text.all, count: statusCounts.all },
    { key: "active", label: text.active, count: statusCounts.active },
    { key: "draft", label: text.draft, count: statusCounts.draft },
    { key: "expired", label: text.expired, count: statusCounts.expired },
    { key: "sold", label: text.sold, count: statusCounts.sold },
  ];

  return (
    <>
      {userCategories.length === 0 ? (
        <DashboardEmptyState
          title={text.noCategoryActivity}
          description={text.emptyListingsHint}
          ctaLabel={text.createFirstListing}
          ctaHref="/dashboard?create=1"
        />
      ) : (
        <>
          <DashboardFilterBar
            categories={categoryItems}
            statuses={statusItems}
            current={filters}
            labels={{
              filtersTitle: text.filtersTitle,
              categoriesLabel: text.categoriesLabel,
              statusLabel: text.statusLabel,
              searchLabel: text.searchLabel,
              searchPlaceholder: text.searchPlaceholder,
              clearSearch: text.clearSearch,
              sortLabel: text.sortLabel,
              sortNewest: text.sortNewest,
              sortPriceLowHigh: text.sortPriceLowHigh,
              sortPriceHighLow: text.sortPriceHighLow,
              viewMode: text.viewMode,
              gridView: text.gridView,
              listView: text.listView,
            }}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          />

          <Card className="border-secondary/20">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">
                    {selectedCategory ? selectedCategory.label : text.allCategories} {text.listings}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {filteredListings.length} {text.results}
                  </p>
                </div>
                <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {filteredListings.length}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {filteredListings.length === 0 ? (
                <DashboardEmptyState
                  title={text.emptyListingsTitle}
                  description={text.emptyListingsHint}
                  ctaLabel={text.createNow}
                  ctaHref={selectedCategory ? `/dashboard?create=1&cat=${selectedCategory.id}` : "/dashboard?create=1"}
                />
              ) : (
                <div
                  className={
                    filters.layout === "list"
                      ? "space-y-3"
                      : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  }
                >
                  {filteredListings.map((listing) => (
                    <DashboardListingCard
                      key={listing.id}
                      listing={listing}
                      locale={locale}
                      layout={filters.layout}
                      text={text}
                      requiresPaymentForCreate={requiresPaymentForCreate}
                      hasActiveSubscription={hasActiveSubscription}
                      publishDraftAction={publishDraftAction}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
