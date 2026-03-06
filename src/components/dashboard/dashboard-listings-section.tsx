import type { ComponentProps } from "react";
import { DashboardListingsPanel } from "@/components/dashboard-listings-panel";

type DashboardListingsPanelProps = ComponentProps<typeof DashboardListingsPanel>;

type DashboardListingsSectionProps = {
  locale: "en" | "mk";
  text: DashboardListingsPanelProps["text"];
  allListingsForClient: DashboardListingsPanelProps["allListings"];
  selectedCategoryIdFromQuery?: string;
  selectedView: "all" | "active" | "draft" | "expired" | "sold";
  selectedSort: "newest" | "price-asc" | "price-desc";
  selectedLayout: "grid" | "list";
  searchQuery: string;
  totalCount: number;
  requiresPaymentForCreate: boolean;
  hasActiveSubscription: boolean;
  publishDraftAction: DashboardListingsPanelProps["publishDraftAction"];
};

export function DashboardListingsSection({
  locale,
  text,
  allListingsForClient,
  selectedCategoryIdFromQuery,
  selectedView,
  selectedSort,
  selectedLayout,
  searchQuery,
  totalCount,
  requiresPaymentForCreate,
  hasActiveSubscription,
  publishDraftAction,
}: DashboardListingsSectionProps) {
  return (
    <section className="max-w-full min-w-0 space-y-3 overflow-x-hidden">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{text.myCategories}</h2>
        <span className="text-sm text-muted-foreground">
          {totalCount} {text.listings}
        </span>
      </div>

      <DashboardListingsPanel
        locale={locale}
        text={text}
        allListings={allListingsForClient}
        initialFilters={{
          cat: selectedCategoryIdFromQuery || "all",
          view: selectedView,
          q: searchQuery,
          sort: selectedSort,
          layout: selectedLayout,
        }}
        requiresPaymentForCreate={requiresPaymentForCreate}
        hasActiveSubscription={hasActiveSubscription}
        publishDraftAction={publishDraftAction}
      />
    </section>
  );
}
