import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardStatsBento } from "@/components/dashboard-stats-bento";

type DashboardAlertsText = {
  draftSaved: string;
  firstFree: string;
  paymentApproved: string;
};

type DashboardAdminText = {
  adminTools: string;
  adminToolsDesc: string;
  moderation: string;
  categoryApprovals: string;
  revenueAnalytics: string;
  usersActions: string;
};

type DashboardStatsText = {
  active: string;
  drafts: string;
  sold: string;
  total: string;
  activeDesc: string;
  draftDesc: string;
  soldDesc: string;
  totalDesc: string;
};

export function DashboardAlertBanners({
  error,
  draftSaved,
  freeActivated,
  paidActivated,
  text,
}: {
  error?: string;
  draftSaved: boolean;
  freeActivated: boolean;
  paidActivated: boolean;
  text: DashboardAlertsText;
}) {
  return (
    <div className="space-y-2">
      {error && (
        <Card className="bg-warning/10 ring-1 ring-warning/15">
          <CardContent className="py-3 text-sm text-foreground">
            {error}
          </CardContent>
        </Card>
      )}
      {draftSaved && (
        <Card className="bg-success/10 ring-1 ring-success/15">
          <CardContent className="py-3 text-sm text-success">
            {text.draftSaved}
          </CardContent>
        </Card>
      )}
      {freeActivated && (
        <Card className="bg-success/10 ring-1 ring-success/15">
          <CardContent className="py-3 text-sm text-success">
            {text.firstFree}
          </CardContent>
        </Card>
      )}
      {paidActivated && (
        <Card className="bg-success/10 ring-1 ring-success/15">
          <CardContent className="py-3 text-sm text-success">
            {text.paymentApproved}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function DashboardAdminTools({
  show,
  text,
}: {
  show: boolean;
  text: DashboardAdminText;
}) {
  if (!show) return null;

  return (
    <details className="rounded-xl bg-blue-50/40 p-3 ring-1 ring-blue-200/70 dark:bg-blue-950/10 dark:ring-blue-700/40">
      <summary className="cursor-pointer list-none text-sm font-semibold">
        {text.adminTools}
      </summary>
      <p className="mt-2 text-sm text-muted-foreground">{text.adminToolsDesc}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin" className="block">
          <Button variant="ghost" className="w-full justify-start">
            {text.moderation}
          </Button>
        </Link>
        <Link href="/admin/categories" className="block">
          <Button variant="ghost" className="w-full justify-start">
            {text.categoryApprovals}
          </Button>
        </Link>
        <Link href="/admin/subscriptions" className="block">
          <Button variant="ghost" className="w-full justify-start">
            {text.revenueAnalytics}
          </Button>
        </Link>
        <Link href="/admin" className="block">
          <Button variant="ghost" className="w-full justify-start">
            {text.usersActions}
          </Button>
        </Link>
      </div>
    </details>
  );
}

export function DashboardStatsSection({
  hasListings,
  activeCount,
  draftCount,
  soldCount,
  totalCount,
  text,
}: {
  hasListings: boolean;
  activeCount: number;
  draftCount: number;
  soldCount: number;
  totalCount: number;
  text: DashboardStatsText;
}) {
  if (!hasListings) return null;

  return (
    <DashboardStatsBento
      stats={[
        {
          key: "active",
          label: text.active,
          value: activeCount,
          description: text.activeDesc,
          tone: "success",
        },
        {
          key: "draft",
          label: text.drafts,
          value: draftCount,
          description: text.draftDesc,
          tone: "warning",
        },
        {
          key: "sold",
          label: text.sold,
          value: soldCount,
          description: text.soldDesc,
          tone: "secondary",
        },
        {
          key: "total",
          label: text.total,
          value: totalCount,
          description: text.totalDesc,
          tone: "default",
        },
      ]}
    />
  );
}
