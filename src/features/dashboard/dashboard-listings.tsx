"use client";

import * as React from "react";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { localizeCategoryName } from "@/lib/category-label";
import { DashboardListingCard } from "@/features/dashboard/dashboard-listing-card";
import { DashboardToolbar } from "@/features/dashboard/dashboard-toolbar";
import type { DashboardFilterState, DashboardListingItem } from "@/features/dashboard/types";
import { buildDashboardStatusItems, filterDashboardListings } from "@/features/dashboard/utils";

const OPEN_CREATE_MODAL_EVENT = "mkd:open-create-modal";

type Props = {
  locale: "mk" | "en";
  text: {
    myCategories: string;
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
    noCategoryActivity: string;
  };
  allListings: DashboardListingItem[];
  initialFilters: DashboardFilterState;
  requiresPaymentForCreate: boolean;
  hasActiveSubscription: boolean;
  publishDraftAction: (formData: FormData) => void | Promise<void>;
};

export function DashboardListings({
  locale,
  text,
  allListings,
  initialFilters,
  requiresPaymentForCreate,
  hasActiveSubscription,
  publishDraftAction,
}: Props) {
  const userCategories = React.useMemo(() => {
    const grouped = new Map<string, { id: string; label: string; posted: number }>();
    for (const listing of allListings) {
      const current = grouped.get(listing.category.id) || {
        id: listing.category.id,
        label: localizeCategoryName(listing.category, locale),
        posted: 0,
      };
      current.posted += 1;
      grouped.set(listing.category.id, current);
    }
    return [...grouped.values()].sort((a, b) => b.posted - a.posted);
  }, [allListings, locale]);

  const validCategoryIds = React.useMemo(
    () => new Set(userCategories.map((category) => category.id)),
    [userCategories],
  );

  const [filters, setFilters] = React.useState<DashboardFilterState>(() => ({
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
    params.set("cat", filters.cat || "all");
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

  const filteredListings = React.useMemo(
    () => filterDashboardListings(categoryScopedListings, filters, locale),
    [categoryScopedListings, filters, locale],
  );

  const categoryItems = [
    { id: "all", label: text.allCategories, count: allListings.length },
    ...userCategories.map((category) => ({
      id: category.id,
      label: category.label,
      count: category.posted,
    })),
  ];

  const statusItems = buildDashboardStatusItems(categoryScopedListings, {
    all: text.all,
    active: text.active,
    draft: text.draft,
    expired: text.expired,
    sold: text.sold,
  });

  const openCreateModal = React.useCallback((categoryId?: string) => {
    const params: Record<string, string> = {};
    if (categoryId) params.cat = categoryId;
    window.dispatchEvent(new CustomEvent(OPEN_CREATE_MODAL_EVENT, { detail: { params } }));
  }, []);

  if (userCategories.length === 0) {
    return (
      <DashboardEmptyState
        title={text.noCategoryActivity}
        description={text.emptyListingsHint}
        ctaLabel={text.createFirstListing}
        onCtaClick={() => openCreateModal()}
      />
    );
  }

  return (
    <section className="space-y-5">
      <DashboardToolbar
        categories={categoryItems}
        statuses={statusItems}
        current={filters}
        labels={{
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

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold tracking-[-0.03em] [overflow-wrap:anywhere]">
            {selectedCategory ? selectedCategory.label : text.myCategories}
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredListings.length} {text.results}
          </p>
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <DashboardEmptyState
          title={text.emptyListingsTitle}
          description={text.emptyListingsHint}
          ctaLabel={text.createNow}
          onCtaClick={() => openCreateModal(selectedCategory?.id)}
        />
      ) : (
        <div
          className={
            filters.layout === "list"
              ? "space-y-3"
              : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
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
    </section>
  );
}
