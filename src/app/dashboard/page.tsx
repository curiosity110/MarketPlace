import { DashboardPageContent } from "@/components/dashboard-page";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Route wrapper: resolves async query params and delegates dashboard orchestration.
  const sp = await searchParams;
  return <DashboardPageContent searchParams={sp} />;
}
