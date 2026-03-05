"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const OPEN_EVENT_NAME = "mkd:open-create-modal";

export function CreateListingModalController({
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
  const isDev = process.env.NODE_ENV !== "production";
  // TEMP (DEV only): set to true for a single run to force the dialog open.
  const DEV_FORCE_OPEN = isDev && false;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [manualOpen, setManualOpen] = useState(false);
  const [pendingOpenParams, setPendingOpenParams] = useState<URLSearchParams | null>(
    null,
  );
  const queryCreateRequested = searchParams.get("create") === "1";
  const createRequested =
    forceOpen || DEV_FORCE_OPEN || manualOpen || queryCreateRequested;
  const modalOpenRef = useRef(createRequested);

  if (isDev) {
    console.log("MODAL_RENDER", { open: createRequested });
  }

  const openModal = useCallback(
    (source: string, params?: URLSearchParams | null) => {
      if (isDev) {
        console.log("MODAL_CLICK", Date.now());
        queueMicrotask(() => {
          console.log("AFTER_CLICK_MICROTASK", {
            source,
            open_now: modalOpenRef.current,
          });
        });
        requestAnimationFrame(() => {
          console.log("AFTER_CLICK_RAF", {
            source,
            open_now: modalOpenRef.current,
          });
        });
      }
      if (params) {
        setPendingOpenParams(new URLSearchParams(params.toString()));
      }
      setManualOpen(true);
    },
    [isDev],
  );

  useEffect(() => {
    modalOpenRef.current = createRequested;
  }, [createRequested]);

  const mergedQueryParams = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString());
    pendingOpenParams?.forEach((value, key) => {
      if (key === "closed") return;
      next.set(key, value);
    });
    return next;
  }, [pendingOpenParams, searchParams]);

  const mergedInitial = useMemo(() => {
    const categoryFromQuery = mergedQueryParams.get("cat")?.trim() || "";
    const subcategoryFromQuery = mergedQueryParams.get("sub")?.trim() || "";
    const titleFromQuery = mergedQueryParams.get("q")?.trim() || "";
    const cityFromQuery = mergedQueryParams.get("city")?.trim() || "";
    const planFromQuery = resolvePlan(mergedQueryParams.get("plan"));

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
  }, [categories, cities, initial, mergedQueryParams, templatesByCategory]);

  const cleanModalQueryParams = useCallback(() => {
    setPendingOpenParams(null);
    setManualOpen(false);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("create");
    nextParams.delete("error");
    nextParams.delete("errorField");
    nextParams.delete("defaultsSaved");
    const nextQuery = nextParams.toString();
    const hasModalQueryParams =
      searchParams.has("create") ||
      searchParams.has("error") ||
      searchParams.has("errorField") ||
      searchParams.has("defaultsSaved");
    if (hasModalQueryParams) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }
  }, [pathname, router, searchParams]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isDev) {
        console.log("MODAL_ON_OPEN_CHANGE", nextOpen);
      }
      setManualOpen(nextOpen);
      if (!nextOpen) {
        cleanModalQueryParams();
      }
    },
    [cleanModalQueryParams, isDev],
  );

  useEffect(() => {
    function handleOpenRequest(event: Event) {
      const customEvent = event as CustomEvent<{ params?: Record<string, string> }>;
      const params = new URLSearchParams();
      const detailParams = customEvent.detail?.params;
      if (detailParams) {
        Object.entries(detailParams).forEach(([key, value]) => {
          if (!value || key === "closed") return;
          params.set(key, value);
        });
      }
      openModal("custom-event", params);
    }

    window.addEventListener(OPEN_EVENT_NAME, handleOpenRequest as EventListener);
    return () => {
      window.removeEventListener(OPEN_EVENT_NAME, handleOpenRequest as EventListener);
    };
  }, [openModal]);

  useEffect(() => {
    function handleSellLinkClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      const shouldOpenModal =
        url.pathname === "/sell" || url.searchParams.get("create") === "1";
      if (!shouldOpenModal) return;

      event.preventDefault();
      openModal("anchor-link", url.searchParams);
    }

    document.addEventListener("click", handleSellLinkClick, true);
    return () => {
      document.removeEventListener("click", handleSellLinkClick, true);
    };
  }, [openModal]);

  return (
    <CreateListingPopout
      mode="button"
      hideTrigger
      open={createRequested}
      onOpenChange={handleOpenChange}
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
