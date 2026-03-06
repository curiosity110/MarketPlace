import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BackButton, PageContainer } from "@/components/ui/layout";

type Props = {
  backLabel: string;
  backHref: string;
  message: string;
};

export function ListingDetailsDbUnavailable({
  backLabel,
  backHref,
  message,
}: Props) {
  return (
    <PageContainer size="wide" className="space-y-4">
      <BackButton label={backLabel} fallbackHref={backHref} />
      <Card className="border-warning/30 bg-warning/10">
        <CardContent className="py-5 text-sm text-foreground">
          {message}
        </CardContent>
      </Card>
      <Link href={backHref} scroll={false}>
        <Button variant="outline">{backLabel}</Button>
      </Link>
    </PageContainer>
  );
}
