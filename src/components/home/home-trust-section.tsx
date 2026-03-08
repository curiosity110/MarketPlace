import { HomeQuickCircles } from "@/components/HomeQuickCircles";
import { Card, CardContent } from "@/components/ui/card";
import type { HomeQuickItem } from "@/components/home/home.types";

type Props = {
  quickTitle: string;
  browseAllLabel: string;
  quickItems: HomeQuickItem[];
  dbUnavailable: boolean;
  dbUnavailableLabel: string;
};

export function HomeTrustSection({
  quickTitle,
  browseAllLabel,
  quickItems,
  dbUnavailable,
  dbUnavailableLabel,
}: Props) {
  return (
    <section className="space-y-5">
      <HomeQuickCircles
        title={quickTitle}
        browseAllLabel={browseAllLabel}
        items={quickItems}
      />

      {dbUnavailable ? (
        <Card className="bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">
            {dbUnavailableLabel}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
