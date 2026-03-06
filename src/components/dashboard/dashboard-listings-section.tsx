import { DashboardListings } from "@/features/dashboard/dashboard-listings";

type Props = {
  locale: "en" | "mk";
  text: Parameters<typeof DashboardListings>[0]["text"];
  allListingsForClient: Parameters<typeof DashboardListings>[0]["allListings"];
  selectedCategoryIdFromQuery?: string;
  selectedView: "all" | "active" | "draft" | "expired" | "sold";
  selectedSort: "newest" | "price-asc" | "price-desc";
  selectedLayout: "grid" | "list";
  searchQuery: string;
  totalCount: number;
  requiresPaymentForCreate: boolean;
  hasActiveSubscription: boolean;
  publishDraftAction: Parameters<typeof DashboardListings>[0]["publishDraftAction"];
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
}: Props) {
  void totalCount;

  return (
    <DashboardListings
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
  );
}
