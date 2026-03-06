import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  page: number;
  totalPages: number;
  pageLabel: string;
  ofLabel: string;
  previousLabel: string;
  nextLabel: string;
  previousHref: string | null;
  nextHref: string | null;
};

export function BrowsePagination({
  page,
  totalPages,
  pageLabel,
  ofLabel,
  previousLabel,
  nextLabel,
  previousHref,
  nextHref,
}: Props) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <p className="text-sm text-muted-foreground">
          {pageLabel} {page} {ofLabel} {totalPages}
        </p>
        <div className="flex gap-2">
          {previousHref ? (
            <Link scroll={false} href={previousHref}>
              <Button variant="outline" type="button">
                {previousLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" type="button" disabled>
              {previousLabel}
            </Button>
          )}
          {nextHref ? (
            <Link scroll={false} href={nextHref}>
              <Button type="button">{nextLabel}</Button>
            </Link>
          ) : (
            <Button type="button" disabled>
              {nextLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
