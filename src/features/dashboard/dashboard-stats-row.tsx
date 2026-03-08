import { StatItem } from "@/components/ui/layout";

type Props = {
  hasListings: boolean;
  activeCount: number;
  draftCount: number;
  soldCount: number;
  totalCount: number;
  text: {
    active: string;
    drafts: string;
    sold: string;
    total: string;
  };
};

export function DashboardStatsRow({
  hasListings,
  activeCount,
  draftCount,
  soldCount,
  totalCount,
  text,
}: Props) {
  if (!hasListings) return null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatItem label={text.active} value={activeCount} tone="success" />
      <StatItem label={text.drafts} value={draftCount} tone="warning" />
      <StatItem label={text.sold} value={soldCount} tone="secondary" />
      <StatItem label={text.total} value={totalCount} tone="default" />
    </div>
  );
}
