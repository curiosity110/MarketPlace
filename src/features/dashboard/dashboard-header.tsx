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
      subtitle={subtitle}
      className="rounded-[1.55rem] border border-border/40 px-4 py-4 hero-surface sm:rounded-[1.9rem] sm:px-6 sm:py-5"
      actions={
        <OpenCreateListingButton
          label={ctaLabel}
          params={selectedCategoryIdFromQuery ? { cat: selectedCategoryIdFromQuery } : undefined}
          disabled={!canCreateListings || !hasCategories}
          className="min-h-12 w-full sm:min-h-11 sm:w-auto"
        />
      }
    />
  );
}
