import { PageHeader } from "@/components/ui/layout";
import { createPublishDraftFromDashboardAction } from "@/components/dashboard/dashboard.actions";
import { DashboardHeaderSection } from "@/components/dashboard/dashboard-header-section";
import { DashboardListingsSection } from "@/components/dashboard/dashboard-listings-section";
import { DashboardAdminTools, DashboardAlertBanners, DashboardStatsSection } from "@/components/dashboard-page-sections";
import { getDashboardText } from "@/components/dashboard/dashboard.text";
import { buildDashboardViewModel } from "@/components/dashboard/dashboard.view-model";
import { fetchDashboardAnalyticsData, parseDashboardLayout, parseDashboardSort, parseDashboardView } from "@/components/dashboard-page.utils";
import { canAccessControl, canSell, requireUser } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n";

export async function DashboardPageContent({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  // Dashboard container orchestrates auth/query/data and delegates all UI rendering to sections.
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = getDashboardText(locale);
  const user = await requireUser();

  const canCreateListings = canSell(user.role);
  const showAdminTools = canAccessControl(user.role);

  const error = searchParams.error;
  const draftSaved = searchParams.draft === "1";
  const freeActivated = searchParams.free === "1";
  const paidActivated = searchParams.paid === "1";
  const selectedView = parseDashboardView(searchParams.view);
  const selectedSort = parseDashboardSort(searchParams.sort);
  const selectedLayout = parseDashboardLayout(searchParams.layout);
  const searchQuery = (searchParams.q || "").trim();

  const analyticsData = await fetchDashboardAnalyticsData(user.authUserId);

  if (!analyticsData) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <PageHeader title={text.sellerDashboard} subtitle={text.dashboardSubtitle} compact />
        <div className="rounded-xl bg-warning/10 px-4 py-4 text-sm text-foreground ring-1 ring-warning/15">
            {error || text.dbUnavailable}
        </div>
      </div>
    );
  }

  const viewModel = buildDashboardViewModel(analyticsData, searchParams.cat);
  const publishDraftFromDashboard = createPublishDraftFromDashboardAction(isMk);

  return (
    <div className="min-h-[calc(100vh-72px)] max-w-full overflow-x-hidden bg-background">
      <div className="mx-auto max-w-7xl min-w-0 space-y-4 px-4 pb-10 pt-3 sm:space-y-5 sm:px-6 lg:px-8">
        <DashboardHeaderSection
          title={text.sellerDashboard}
          subtitle={text.dashboardSubtitle}
          ctaLabel={text.createNow}
          selectedCategoryIdFromQuery={viewModel.selectedCategoryIdFromQuery}
          canCreateListings={canCreateListings}
          hasCategories={analyticsData[1].length > 0}
        />

        <DashboardAlertBanners
          error={error}
          draftSaved={draftSaved}
          freeActivated={freeActivated}
          paidActivated={paidActivated}
          text={text}
        />

        <DashboardAdminTools show={showAdminTools} text={text} />

        <DashboardStatsSection
          hasListings={viewModel.allListingsCount > 0}
          activeCount={viewModel.activeListingsCount}
          draftCount={viewModel.draftCount}
          soldCount={viewModel.soldListingsCount}
          totalCount={viewModel.allListingsCount}
          text={text}
        />

        <DashboardListingsSection
          locale={locale}
          text={text}
          allListingsForClient={viewModel.allListingsForClient}
          selectedCategoryIdFromQuery={viewModel.selectedCategoryIdFromQuery}
          selectedView={selectedView}
          selectedSort={selectedSort}
          selectedLayout={selectedLayout}
          searchQuery={searchQuery}
          totalCount={viewModel.allListingsCount}
          requiresPaymentForCreate={viewModel.requiresPaymentForCreate}
          hasActiveSubscription={viewModel.hasActiveSubscription}
          publishDraftAction={publishDraftFromDashboard}
        />
      </div>
    </div>
  );
}
