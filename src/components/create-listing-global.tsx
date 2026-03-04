"use client";

import { useMemo } from "react";
import { Currency, ListingCondition } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CreateListingPopout } from "@/components/create-listing-popout";

type Category = { id: string; name: string; slug: string; parentId?: string | null };
type City = { id: string; name: string };
type Template = {
  id: string;
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN";
  required: boolean;
  order: number;
  options: string[];
};
type ListingPlan = "pay-per-listing" | "subscription";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  cities: City[];
  templatesByCategory: Record<string, Template[]>;
  publishLabel: string;
  paymentProvider: "none" | "stripe-dummy";
  showPlanSelector: boolean;
  locale: "en" | "mk";
  initial?: {
    title?: string;
    description?: string;
    price?: number;
    currency?: Currency;
    condition?: ListingCondition;
    categoryId?: string;
    cityId?: string;
    phone?: string;
    phoneCountry?: string;
    dynamicValues?: Record<string, string>;
    plan?: ListingPlan;
  };
  forceOpen?: boolean;
};

function resolvePlan(value: string | null): ListingPlan | undefined {
  if (value === "pay-per-listing" || value === "subscription") return value;
  return undefined;
}

export function CreateListingGlobal({
  action,
  categories,
  cities,
  templatesByCategory,
  publishLabel,
  paymentProvider,
  showPlanSelector,
  locale,
  initial,
  forceOpen = false,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const createRequested =
    forceOpen || searchParams.get("create") === "1";
  const shouldDisableOnSell = pathname === "/sell" && !forceOpen;

  const mergedInitial = useMemo(() => {
    const categoryFromQuery = searchParams.get("cat");
    const planFromQuery = resolvePlan(searchParams.get("plan"));
    const categoryIsValid =
      categoryFromQuery &&
      categories.some((category) => category.id === categoryFromQuery);

    return {
      ...initial,
      categoryId: categoryIsValid ? categoryFromQuery : initial?.categoryId,
      plan: planFromQuery ?? initial?.plan,
    };
  }, [categories, initial, searchParams]);

  function closeAndCleanQuery() {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("create");
    if (pathname === "/sell") {
      nextParams.set("closed", "1");
    }
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }

  if (shouldDisableOnSell || !createRequested) return null;

  return (
    <CreateListingPopout
      key={`${pathname}?${searchParams.toString()}`}
      mode="button"
      hideTrigger
      openOnMount
      onClose={closeAndCleanQuery}
      action={action}
      categories={categories}
      cities={cities}
      templatesByCategory={templatesByCategory}
      allowDraft={false}
      showPlanSelector={showPlanSelector}
      publishLabel={publishLabel}
      paymentProvider={paymentProvider}
      initial={mergedInitial}
      locale={locale}
    />
  );
}
