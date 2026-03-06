import { PageHeader } from "@/components/ui/layout";
import { OpenCreateListingButton } from "@/components/open-create-listing-button";

type DashboardHeaderSectionProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  selectedCategoryIdFromQuery?: string;
  canCreateListings: boolean;
  hasCategories: boolean;
};

export function DashboardHeaderSection({
  title,
  subtitle,
  ctaLabel,
  selectedCategoryIdFromQuery,
  canCreateListings,
  hasCategories,
}: DashboardHeaderSectionProps) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      compact
      className="max-w-full min-w-0 border-b border-border/40 pb-3"
      titleClassName=""
      subtitleClassName="max-w-2xl text-sm"
      actions={
        <div className="pt-1 sm:pt-0">
          <OpenCreateListingButton
            label={ctaLabel}
            params={selectedCategoryIdFromQuery ? { cat: selectedCategoryIdFromQuery } : undefined}
            disabled={!canCreateListings || !hasCategories}
          />
        </div>
      }
    />
  );
}
