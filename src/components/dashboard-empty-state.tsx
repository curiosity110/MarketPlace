import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export function DashboardEmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: Props) {
  return (
    <Card className="border-border/70 bg-muted/20">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground">
          <PackageSearch className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="text-base font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Link href={ctaHref}>
          <Button>{ctaLabel}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
