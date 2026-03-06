import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PopularCategory = {
  id: string;
  name: string;
};

type Props = {
  hasAppliedFilters: boolean;
  noMatchLabel: string;
  noListingsYetLabel: string;
  createHref: string;
  firstListLabel: string;
  showPopularCategories: boolean;
  popularCategoriesLabel: string;
  popularCategories: PopularCategory[];
};

export function BrowseEmptyState({
  hasAppliedFilters,
  noMatchLabel,
  noListingsYetLabel,
  createHref,
  firstListLabel,
  showPopularCategories,
  popularCategoriesLabel,
  popularCategories,
}: Props) {
  void showPopularCategories;
  void popularCategoriesLabel;
  void popularCategories;
  return (
    <Card className="shadow-none">
      <CardContent className="py-10 text-center sm:py-12">
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          {hasAppliedFilters ? noMatchLabel : noListingsYetLabel}
        </p>
        <Link href={createHref} className="mt-4 inline-block">
          <Button>{firstListLabel}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
