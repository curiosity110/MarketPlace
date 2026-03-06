import { DashboardFeaturePage } from "@/features/dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  return <DashboardFeaturePage searchParams={sp} />;
}
