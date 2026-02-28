import { DashboardPageContent } from "@/components/dashboard-page";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  return <DashboardPageContent searchParams={sp} />;
}

