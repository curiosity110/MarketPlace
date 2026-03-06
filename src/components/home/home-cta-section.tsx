import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HomePricingPlan, HomeText } from "@/components/home/home.types";

type Props = {
  text: HomeText;
  pricingPlans: HomePricingPlan[];
};

export function HomeCtaSection({ text, pricingPlans }: Props) {
  return (
    <section className="max-w-full min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex max-w-full min-w-0 items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words text-3xl font-bold [overflow-wrap:anywhere]">
            {text.sellerPricing}
          </h2>
          <p className="break-words text-muted-foreground [overflow-wrap:anywhere]">
            {text.sellerPricingDesc}
          </p>
        </div>
      </div>

      <div className="grid max-w-full min-w-0 gap-4 md:grid-cols-2">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.featured
                ? "border-primary/35 bg-gradient-to-br from-orange-50/70 via-card to-blue-50/70 dark:from-orange-950/20 dark:to-blue-950/20"
                : ""
            }
          >
            <CardContent className="space-y-5">
              <div className="space-y-2">
                {plan.featured ? (
                  <Badge variant="primary" className="rounded-full px-3 py-1">
                    {text.recommended}
                  </Badge>
                ) : null}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <p className="text-4xl font-black">
                {plan.price}
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {plan.cadence}
                </span>
              </p>
              <ul className="space-y-2">
                {plan.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <Button
                  className="w-full"
                  variant={plan.featured ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
