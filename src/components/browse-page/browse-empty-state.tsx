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
  return (
    <Card>
      <CardContent className="py-14 text-center">
        <p className="text-muted-foreground">
          {hasAppliedFilters ? noMatchLabel : noListingsYetLabel}
        </p>
        <Link href={createHref} className="mt-4 inline-block">
          <Button>{firstListLabel}</Button>
        </Link>
        {showPopularCategories ? (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {popularCategoriesLabel}
            </span>
            {popularCategories.map((category) => (
              <Link
                key={category.id}
                href={`/browse?cat=${category.id}`}
                scroll={false}
              >
                <Button variant="outline" size="sm" className="rounded-full">
                  {category.name}
                </Button>
              </Link>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
