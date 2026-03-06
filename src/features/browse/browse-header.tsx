import { PageHeader } from "@/components/ui/layout";

type Props = {
  title: string;
  totalCount: number;
  resultsLabel: string;
  support?: string;
};

export function BrowseHeader({ title, totalCount, resultsLabel, support }: Props) {
  void support;
  return (
    <PageHeader
      title={title}
      subtitle={
        <span>
          <span className="font-medium text-foreground">{totalCount}</span> {resultsLabel}
        </span>
      }
      compact
    />
  );
}
