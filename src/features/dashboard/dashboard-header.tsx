import { OpenCreateListingButton } from "@/components/open-create-listing-button";
import { PageHeader } from "@/components/ui/layout";

type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  selectedCategoryIdFromQuery?: string;
  canCreateListings: boolean;
  hasCategories: boolean;
};

export function DashboardHeader({
  title,
  subtitle,
  ctaLabel,
  selectedCategoryIdFromQuery,
  canCreateListings,
  hasCategories,
}: Props) {
  void subtitle;

  return (
    <PageHeader
      title={title}
      compact
      className="border-b border-border/40 pb-3"
      actions={
        <OpenCreateListingButton
          label={ctaLabel}
          params={selectedCategoryIdFromQuery ? { cat: selectedCategoryIdFromQuery } : undefined}
          disabled={!canCreateListings || !hasCategories}
          className="w-full sm:w-auto"
        />
      }
    />
  );
}
