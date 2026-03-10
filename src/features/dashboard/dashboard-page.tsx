import { createPublishDraftFromDashboardAction } from "@/components/dashboard/dashboard.actions";
import { getDashboardText } from "@/components/dashboard/dashboard.text";
import { buildDashboardViewModel } from "@/components/dashboard/dashboard.view-model";
import {
  DashboardAdminTools,
  DashboardAlertBanners,
} from "@/components/dashboard-page-sections";
import { PageHeader, PageShell, SectionBlock } from "@/components/ui/layout";
import {
  fetchDashboardAnalyticsData,
  parseDashboardLayout,
  parseDashboardSort,
  parseDashboardView,
} from "@/components/dashboard-page.utils";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { DashboardListings } from "@/features/dashboard/dashboard-listings";
import { DashboardStatsRow } from "@/features/dashboard/dashboard-stats-row";
import { canAccessControl, canSell, requireUser } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n";

export async function DashboardFeaturePage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
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
      <PageShell size="wide">
        <PageHeader title={text.sellerDashboard} subtitle={text.dashboardSubtitle} compact />
        <div className="rounded-xl bg-warning/10 px-4 py-4 text-sm text-foreground ring-1 ring-warning/15">
          {error || text.dbUnavailable}
        </div>
      </PageShell>
    );
  }

  const viewModel = buildDashboardViewModel(analyticsData, searchParams.cat);
  const publishDraftFromDashboard = createPublishDraftFromDashboardAction(isMk);

  return (
    <PageShell size="wide" className="space-y-3.5 sm:space-y-4">
      <DashboardHeader
        title={text.sellerDashboard}
        subtitle={text.dashboardSubtitle}
        ctaLabel={text.createNow}
        selectedCategoryIdFromQuery={viewModel.selectedCategoryIdFromQuery}
        canCreateListings={canCreateListings}
      />
      <DashboardAlertBanners
        error={error}
        draftSaved={draftSaved}
        freeActivated={freeActivated}
        paidActivated={paidActivated}
        text={text}
      />
      <DashboardAdminTools show={showAdminTools} text={text} />
      <DashboardStatsRow
        hasListings={viewModel.allListingsCount > 0}
        activeCount={viewModel.activeListingsCount}
        draftCount={viewModel.draftCount}
        soldCount={viewModel.soldListingsCount}
        totalCount={viewModel.allListingsCount}
        text={text}
      />
      <SectionBlock
        title={text.myCategories}
        className="space-y-3.5"
        contentClassName="space-y-3.5"
      >
        <DashboardListings
          locale={locale}
          text={text}
          allListings={viewModel.allListingsForClient}
          initialFilters={{
            cat: viewModel.selectedCategoryIdFromQuery || "all",
            view: selectedView,
            q: searchQuery,
            sort: selectedSort,
            layout: selectedLayout,
          }}
          requiresPaymentForCreate={viewModel.requiresPaymentForCreate}
          hasActiveSubscription={viewModel.hasActiveSubscription}
          publishDraftAction={publishDraftFromDashboard}
        />
      </SectionBlock>
    </PageShell>
  );
}
