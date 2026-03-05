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
    const categoryFromQuery = searchParams.get("cat")?.trim() || "";
    const subcategoryFromQuery = searchParams.get("sub")?.trim() || "";
    const titleFromQuery = searchParams.get("q")?.trim() || "";
    const cityFromQuery = searchParams.get("city")?.trim() || "";
    const planFromQuery = resolvePlan(searchParams.get("plan"));

    const resolveCategoryId = (token: string) =>
      token
        ? categories.find(
            (category) => category.id === token || category.slug === token,
          )?.id
        : undefined;

    const hasTemplates = (categoryId: string | undefined) =>
      Boolean(categoryId && (templatesByCategory[categoryId]?.length ?? 0) > 0);

    const subCategoryId = resolveCategoryId(subcategoryFromQuery);
    const categoryIdFromCat = resolveCategoryId(categoryFromQuery);
    const resolvedQueryCategoryId = subCategoryId ?? categoryIdFromCat;
    const resolvedQueryCategoryRecord = resolvedQueryCategoryId
      ? categories.find((category) => category.id === resolvedQueryCategoryId)
      : undefined;

    const fallbackParentCategoryId =
      resolvedQueryCategoryRecord?.parentId &&
      hasTemplates(resolvedQueryCategoryRecord.parentId)
        ? resolvedQueryCategoryRecord.parentId
        : undefined;
    const categoryIdWithTemplate = hasTemplates(resolvedQueryCategoryId)
      ? resolvedQueryCategoryId
      : fallbackParentCategoryId;

    const normalizedCityQuery = cityFromQuery
      .normalize("NFKD")
      .toLowerCase()
      .trim();
    const resolvedCityId = cityFromQuery
      ? cities.find((city) => {
          if (city.id === cityFromQuery) return true;
          return (
            city.name
              .normalize("NFKD")
              .toLowerCase()
              .trim() === normalizedCityQuery
          );
        })?.id
      : undefined;

    return {
      ...initial,
      title: titleFromQuery || initial?.title,
      categoryId: categoryIdWithTemplate ?? initial?.categoryId,
      cityId: resolvedCityId ?? initial?.cityId,
      plan: planFromQuery ?? initial?.plan,
    };
  }, [categories, cities, initial, searchParams, templatesByCategory]);

  function closeAndCleanQuery() {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("create");
    nextParams.delete("error");
    nextParams.delete("errorField");
    nextParams.delete("defaultsSaved");
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
