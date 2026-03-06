"use client";

import type { CreateListingPlan } from "@/components/create-listing/types";

type Props = {
  titleLabel: string;
  payPerListingLabel: string;
  daysActiveLabel: string;
  subscriptionLabel: string;
  monthlyUnlimitedLabel: string;
  paymentAfterPublishLabel: string;
  paymentAmount: number;
  requiresDummyPayment: boolean;
  value: CreateListingPlan;
  onChange: (next: CreateListingPlan) => void;
};

export function CreateListingPlanSection({
  titleLabel,
  payPerListingLabel,
  daysActiveLabel,
  subscriptionLabel,
  monthlyUnlimitedLabel,
  paymentAfterPublishLabel,
  paymentAmount,
  requiresDummyPayment,
  value,
  onChange,
}: Props) {
  return (
    <section className="space-y-2 rounded-2xl bg-card/80 p-4 ring-1 ring-border/60 sm:p-5">
      <h3 className="text-sm font-semibold tracking-tight">{titleLabel}</h3>
      <div className="grid gap-2 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("pay-per-listing")}
          className={`rounded-xl p-3 text-left ring-1 transition-colors ${
            value === "pay-per-listing"
              ? "bg-primary/10 ring-primary/35"
              : "bg-background ring-border/60 hover:ring-primary/30"
          }`}
        >
          <p className="text-sm font-semibold">{payPerListingLabel}</p>
          <p className="text-xl font-bold text-primary">$4</p>
          <p className="text-xs text-muted-foreground">{daysActiveLabel}</p>
        </button>

        <button
          type="button"
          onClick={() => onChange("subscription")}
          className={`rounded-xl p-3 text-left ring-1 transition-colors ${
            value === "subscription"
              ? "bg-secondary/10 ring-secondary/35"
              : "bg-background ring-border/60 hover:ring-secondary/30"
          }`}
        >
          <p className="text-sm font-semibold">{subscriptionLabel}</p>
          <p className="text-xl font-bold text-secondary">$30</p>
          <p className="text-xs text-muted-foreground">{monthlyUnlimitedLabel}</p>
        </button>
      </div>
      {requiresDummyPayment ? (
        <p className="text-xs text-muted-foreground">
          {paymentAfterPublishLabel} <span className="font-semibold">${paymentAmount}.</span>
        </p>
      ) : null}
    </section>
  );
}
