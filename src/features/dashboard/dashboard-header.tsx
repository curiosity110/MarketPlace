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
      className="rounded-[1.9rem] border border-border/40 px-5 py-5 hero-surface sm:px-6"
      actions={
        <OpenCreateListingButton
          label={ctaLabel}
          params={selectedCategoryIdFromQuery ? { cat: selectedCategoryIdFromQuery } : undefined}
          disabled={!canCreateListings || !hasCategories}
          className="h-11 w-full sm:w-auto"
        />
      }
    />
  );
}
