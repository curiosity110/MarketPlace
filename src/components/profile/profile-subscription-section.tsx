import Link from "next/link";
import { buildCreateListingHref } from "@/lib/create-listing-href";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProfileSubscriptionSectionProps = {
  isMk: boolean;
  nextPayPerExpiryDate: Date | null;
  subscriptionActive: number;
  payPerListingActive: number;
  testDummyBillingCardAction: (formData: FormData) => Promise<void>;
  successCards: readonly string[];
  failCards: readonly string[];
  text: {
    postingAndSubscription: string;
    postingAndSubscriptionDesc: string;
    nextExpiry: string;
    subscriptionState: string;
    subscriptionStateHint: string;
    noActiveCycle: string;
    payPerListing: string;
    listing30: string;
    activeWithPlan: string;
    postWith4: string;
    subscription: string;
    monthlyUnlimited: string;
    activeWithSubscription: string;
    startSubscriptionFlow: string;
    dummyStripeOptional: string;
    cardNumber: string;
    expiry: string;
    cvc: string;
    runBillingTest: string;
    successCards: string;
    failCards: string;
  };
};

export function ProfileSubscriptionSection({
  isMk,
  nextPayPerExpiryDate,
  subscriptionActive,
  payPerListingActive,
  testDummyBillingCardAction,
  successCards,
  failCards,
  text,
}: ProfileSubscriptionSectionProps) {
  void text.postingAndSubscriptionDesc;
  void text.subscriptionStateHint;
  void text.listing30;
  void text.monthlyUnlimited;
  void text.successCards;
  void text.failCards;
  void successCards;
  void failCards;

  return (
    <details className="max-w-full min-w-0 overflow-x-hidden rounded-2xl bg-card/70 p-4 ring-1 ring-black/5 dark:ring-white/10">
      <summary className="cursor-pointer list-none text-sm font-semibold">
        {text.postingAndSubscription}
      </summary>
      <div className="mt-4 space-y-4">
        <div className="rounded-xl bg-muted/30 px-3 py-2 text-sm ring-1 ring-black/5 dark:ring-white/10">
          {nextPayPerExpiryDate ? (
            <p>
              <span className="font-semibold">{text.nextExpiry}:</span>{" "}
              {nextPayPerExpiryDate.toLocaleDateString(isMk ? "mk-MK" : "en-US")}
            </p>
          ) : subscriptionActive > 0 ? (
            <p>
              <span className="font-semibold">{text.subscriptionState}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">{text.noActiveCycle}</p>
          )}
        </div>

        <div className="grid max-w-full min-w-0 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-background/85 p-3 ring-1 ring-black/5 dark:ring-white/10">
            <p className="text-sm font-semibold">{text.payPerListing}</p>
            <p className="text-2xl font-semibold tracking-tight text-primary">$4</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {text.activeWithPlan}: {payPerListingActive}
            </p>
            <Link href={buildCreateListingHref({ plan: "pay-per-listing" })} className="mt-2 block">
              <Button className="w-full">{text.postWith4}</Button>
            </Link>
          </div>

          <div className="rounded-xl bg-background/85 p-3 ring-1 ring-black/5 dark:ring-white/10">
            <p className="text-sm font-semibold">{text.subscription}</p>
            <p className="text-2xl font-semibold tracking-tight text-secondary">$30</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {text.activeWithSubscription}: {subscriptionActive}
            </p>
            <Link href={buildCreateListingHref({ plan: "subscription" })} className="mt-2 block">
              <Button variant="outline" className="w-full">
                {text.startSubscriptionFlow}
              </Button>
            </Link>
          </div>
        </div>

        <details className="rounded-xl bg-background/85 p-3 ring-1 ring-black/5 dark:ring-white/10">
          <summary className="cursor-pointer text-sm font-semibold">{text.dummyStripeOptional}</summary>
          <form action={testDummyBillingCardAction} className="mt-3 grid gap-3 sm:grid-cols-4">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">{text.cardNumber}</span>
              <Input
                name="dummyCardNumber"
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="cc-number"
                required
                pattern="[0-9 ]{16,23}"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">{text.expiry}</span>
              <Input
                name="dummyCardExp"
                placeholder="MM/YY"
                autoComplete="cc-exp"
                required
                pattern="(0[1-9]|1[0-2])/[0-9]{2}"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">{text.cvc}</span>
              <Input
                name="dummyCardCvc"
                placeholder="CVC"
                inputMode="numeric"
                autoComplete="cc-csc"
                required
                pattern="[0-9]{3,4}"
              />
            </label>
            <div className="sm:col-span-4">
              <Button type="submit">{text.runBillingTest}</Button>
            </div>
          </form>
        </details>
      </div>
    </details>
  );
}
