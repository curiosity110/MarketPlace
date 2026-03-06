"use client";

import { FormBlock } from "@/components/ui/layout";
import type { CreateListingPlanOption } from "@/features/create-listing/types";

type Props = {
  title: string;
  description: string;
  payPerListingLabel: string;
  daysActiveLabel: string;
  subscriptionLabel: string;
  monthlyUnlimitedLabel: string;
  paymentAfterPublishLabel: string;
  paymentAmount: number;
  requiresDummyPayment: boolean;
  value: CreateListingPlanOption;
  onChange: (next: CreateListingPlanOption) => void;
};

export function SellerPackageSection({
  title,
  description,
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
    <FormBlock title={title} description={description}>
      <div className="space-y-3">
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => onChange("pay-per-listing")}
            className={`rounded-[1rem] px-4 py-3 text-left ring-1 transition-colors ${
              value === "pay-per-listing"
                ? "bg-primary/8 ring-primary/30"
                : "bg-background ring-border/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{payPerListingLabel}</p>
                <p className="text-sm text-muted-foreground">{daysActiveLabel}</p>
              </div>
              <p className="text-base font-semibold">$4</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChange("subscription")}
            className={`rounded-[1rem] px-4 py-3 text-left ring-1 transition-colors ${
              value === "subscription"
                ? "bg-primary/8 ring-primary/30"
                : "bg-background ring-border/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{subscriptionLabel}</p>
                <p className="text-sm text-muted-foreground">{monthlyUnlimitedLabel}</p>
              </div>
              <p className="text-base font-semibold">$30</p>
            </div>
          </button>
        </div>

        {requiresDummyPayment ? (
          <p className="text-sm text-muted-foreground">
            {paymentAfterPublishLabel} <span className="font-medium">${paymentAmount}.</span>
          </p>
        ) : null}
      </div>
    </FormBlock>
  );
}
