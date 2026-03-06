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
      className="max-w-full min-w-0"
      actions={
        <OpenCreateListingButton
          label={ctaLabel}
          params={selectedCategoryIdFromQuery ? { cat: selectedCategoryIdFromQuery } : undefined}
          disabled={!canCreateListings || !hasCategories}
        />
      }
    />
  );
}
