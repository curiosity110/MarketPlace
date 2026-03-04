import { Card, CardContent } from "@/components/ui/card";
import {
  DashboardFilterSkeleton,
  DashboardListingsSkeleton,
  DashboardStatsSkeleton,
} from "@/components/dashboard-skeletons";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="hero-surface border-border/70">
        <CardContent className="space-y-3 p-6 sm:p-8">
          <div className="h-10 w-72 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>

      <DashboardStatsSkeleton />
      <DashboardFilterSkeleton />
      <DashboardListingsSkeleton />
    </div>
  );
}
