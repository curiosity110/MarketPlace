"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Currency, ListingCondition } from "@prisma/client";
import { Button } from "@/components/ui/button";
import type {
  CreateListingCategory,
  CreateListingCity as City,
  CreateListingPlan as ListingPlan,
  CreateListingTemplate as Template,
} from "@/components/create-listing/types";
import { CreateListingCategoryGate } from "@/components/create-listing/category-gate/category-gate";
import { CreateListingModalHeader } from "@/components/create-listing/modal-header";
import { CreateListingModalShell } from "@/components/create-listing/modal-shell";
import {
  collectAllLabelStrings,
  normalizeCreateCategorySearchText,
  scoreCreateCategoryQuery,
} from "@/components/create-listing/popout.utils";
import { CreateListingWizardForm } from "@/components/create-listing-wizard-form";
import { ListingForm } from "@/components/listing-form";
import { uiSurface } from "@/components/ui/ui-patterns";
import { localizeCategoryName } from "@/lib/category-label";

type Category = CreateListingCategory & { [key: string]: unknown };

type Props = {
  action: (formData: FormData) => Promise<unknown> | unknown;
  categories: Category[];
  cities: City[];
  templatesByCategory: Record<string, Template[]>;
  allowDraft?: boolean;
  showPlanSelector?: boolean;
  publishLabel?: string;
  paymentProvider?: "none" | "stripe-dummy";
  mode?: "card" | "button";
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  buttonSize?: "sm" | "md" | "lg";
  buttonClassName?: string;
  hideTrigger?: boolean;
  openOnMount?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  initial?: {
    id?: string;
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
  locale?: "en" | "mk";
  serverError?: string | null;
  serverErrorField?: string | null;
};

type CategorySearchEntry = {
  category: Category;
  localizedName: string;
  normalizedSearchText: string;
  selectable: boolean;
  hasSelectableChildren: boolean;
};

export function CreateListingPopout({
  action,
  categories,
  cities,
  templatesByCategory,
  allowDraft = true,
  showPlanSelector = true,
  publishLabel,
  paymentProvider = "none",
  mode = "card",
  buttonLabel,
  buttonVariant = "default",
  buttonSize = "md",
  buttonClassName = "",
  hideTrigger = false,
  openOnMount = false,
  open,
  onOpenChange,
  onClose,
  initial,
  locale = "en",
  serverError,
  serverErrorField,
}: Props) {
  // Modal orchestrator: open/close lifecycle + gate/wizard selection; form logic lives in child forms.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const queryErrorField = searchParams.get("errorField");
  const queryDefaultsSaved = searchParams.get("defaultsSaved") === "1";
  const resolvedServerError = serverError ?? queryError;
  const resolvedServerErrorField = serverErrorField ?? queryErrorField;
  const isMk = locale === "mk";
  const text = isMk
    ? {
        createListing: "Create listing",
        openWhenNeeded: "Open the form only when you need it.",
        closeCreateListingForm: "Close create listing form",
        createNewListing: "Create a new listing",
        fillAndPublish: "Guided in 4 steps: photos, basics, details, and review.",
        close: "Close",
        chooseCategoryTitle: "Choose a category to start",
        chooseCategoryHint:
          "Pick a category first so the form loads with the correct templates.",
        categorySearchLabel: "Live category search",
        categorySearchPlaceholder: "Start typing (ex. cars, auto, kola)",
        category: "Category",
        subcategories: "Subcategories",
        noCategoriesAvailable: "No categories are currently available for posting.",
        noCategoryMatch: "No categories match this search.",
        noTemplatesForCategory:
          "This category has no listing fields yet. Choose another.",
        needsSubcategory: "Choose a subcategory to continue.",
      }
    : {
        createListing: "Create listing",
        openWhenNeeded: "Open the form only when you need it.",
        closeCreateListingForm: "Close create listing form",
        createNewListing: "Create a new listing",
        fillAndPublish: "Guided in 4 steps: photos, basics, details, and review.",
        close: "Close",
        chooseCategoryTitle: "Choose a category to start",
        chooseCategoryHint:
          "Pick a category first so the form loads with the correct templates.",
        categorySearchLabel: "Live category search",
        categorySearchPlaceholder: "Start typing (ex. cars, auto, kola)",
        category: "Category",
        subcategories: "Subcategories",
        noCategoriesAvailable: "No categories are currently available for posting.",
        noCategoryMatch: "No categories match this search.",
        noTemplatesForCategory:
          "This category has no listing fields yet. Choose another.",
        needsSubcategory: "Choose a subcategory to continue.",
      };

  const resolvedButtonLabel = buttonLabel ?? "New listing";
  const resolvedPublishLabel =
    publishLabel ?? "Publish listing";
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpenControlled = typeof open === "boolean";
  const isOpen = isOpenControlled ? open : internalOpen;
  const [isActive, setIsActive] = useState(false);
  const previousIsOpenRef = useRef(isOpen);
  const isClosingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const autoOpenDoneRef = useRef(false);
  const pickerContainerRef = useRef<HTMLDivElement | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [activeCategoryResultIndex, setActiveCategoryResultIndex] = useState(0);

  const queryCategoryId =
    searchParams.get("sub")?.trim() ||
    searchParams.get("cat")?.trim() ||
    "";
  const queryCategoryRecord = useMemo(
    () =>
      queryCategoryId
        ? categories.find(
            (category) =>
              category.id === queryCategoryId || category.slug === queryCategoryId,
          ) || null
        : null,
    [categories, queryCategoryId],
  );
  const queryHasValidCategory = useMemo(
    () => Boolean(queryCategoryRecord),
    [queryCategoryRecord],
  );
  const requiresExplicitCategorySelection =
    !initial?.id && pathname === "/sell" && !queryHasValidCategory;
  const [selectedCreateCategoryId, setSelectedCreateCategoryId] = useState(() => {
    if (initial?.id || requiresExplicitCategorySelection) return "";
    const initialCategoryId = initial?.categoryId || queryCategoryRecord?.id;
    if (
      initialCategoryId &&
      categories.some((category) => category.id === initialCategoryId)
    ) {
      return initialCategoryId;
    }
    return "";
  });
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState(() => {
    const preselectedCategoryId = initial?.categoryId || queryCategoryRecord?.id;
    if (!preselectedCategoryId) return "";
    const initialCategory = categories.find(
      (category) => category.id === preselectedCategoryId,
    );
    if (!initialCategory) return "";
    return initialCategory.parentId || initialCategory.id;
  });

  const categoriesWithTemplates = useMemo(
    () =>
      categories.filter(
        (category) => (templatesByCategory[category.id]?.length ?? 0) > 0,
      ),
    [categories, templatesByCategory],
  );
  const selectableCategoryIds = useMemo(
    () => new Set(categoriesWithTemplates.map((category) => category.id)),
    [categoriesWithTemplates],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const childrenByParentId = useMemo(() => {
    const next = new Map<string, Category[]>();
    categories.forEach((category) => {
      if (!category.parentId) return;
      const existing = next.get(category.parentId) ?? [];
      existing.push(category);
      next.set(category.parentId, existing);
    });
    return next;
  }, [categories]);
  const hasSelectableChildren = useCallback(
    (categoryId: string) =>
      Boolean(
        (childrenByParentId.get(categoryId) ?? []).some((child) =>
          selectableCategoryIds.has(child.id),
        ),
      ),
    [childrenByParentId, selectableCategoryIds],
  );

  const pickerCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          selectableCategoryIds.has(category.id) || hasSelectableChildren(category.id),
      ),
    [categories, hasSelectableChildren, selectableCategoryIds],
  );

  const pickerRootCategories = useMemo(
    () =>
      pickerCategories.filter((category) => {
        if (!category.parentId) return true;
        return !pickerCategories.some((item) => item.id === category.parentId);
      }),
    [pickerCategories],
  );

  const categorySearchIndex = useMemo<CategorySearchEntry[]>(
    () =>
      pickerCategories.map((category) => {
        const labelValues = new Set<string>([
          category.name,
          category.slug.replace(/-/g, " "),
          localizeCategoryName(category, "en"),
          localizeCategoryName(category, "mk"),
        ]);
        collectAllLabelStrings(category, labelValues);
        const normalizedSearchText = normalizeCreateCategorySearchText(
          [...labelValues].join(" "),
        );
        return {
          category,
          localizedName: localizeCategoryName(category, locale),
          normalizedSearchText,
          selectable: selectableCategoryIds.has(category.id),
          hasSelectableChildren: hasSelectableChildren(category.id),
        };
      }),
    [hasSelectableChildren, locale, pickerCategories, selectableCategoryIds],
  );

  const normalizedCategoryQuery = normalizeCreateCategorySearchText(categorySearch);
  const categoryQueryTokens = useMemo(
    () => normalizedCategoryQuery.split(" ").filter(Boolean),
    [normalizedCategoryQuery],
  );
  const displayedCategoryResults = useMemo(() => {
    if (!normalizedCategoryQuery) {
      return categorySearchIndex
        .filter((entry) => pickerRootCategories.some((root) => root.id === entry.category.id))
        .sort((a, b) => a.localizedName.localeCompare(b.localizedName, locale))
        .slice(0, 14);
    }

    return categorySearchIndex
      .map((entry) => ({
        ...entry,
        score: scoreCreateCategoryQuery(
          entry.normalizedSearchText,
          normalizedCategoryQuery,
          categoryQueryTokens,
        ),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.localizedName.localeCompare(b.localizedName, locale);
      })
      .slice(0, 18);
  }, [
    categorySearchIndex,
    categoryQueryTokens,
    locale,
    normalizedCategoryQuery,
    pickerRootCategories,
  ]);

  const safeActiveCategoryResultIndex =
    displayedCategoryResults.length === 0
      ? 0
      : Math.min(activeCategoryResultIndex, displayedCategoryResults.length - 1);

  const selectedParentSubcategories = useMemo(() => {
    const resolvedParentId =
      selectedParentCategoryId ||
      categoryById.get(selectedCreateCategoryId)?.parentId ||
      selectedCreateCategoryId;
    if (!resolvedParentId) return [];
    return (childrenByParentId.get(resolvedParentId) ?? []).filter((child) =>
      selectableCategoryIds.has(child.id),
    );
  }, [
    categoryById,
    childrenByParentId,
    selectableCategoryIds,
    selectedCreateCategoryId,
    selectedParentCategoryId,
  ]);

  const resolvedCreateCategoryId = useMemo(() => {
    if (!selectedCreateCategoryId) return "";
    return categoriesWithTemplates.some(
      (category) => category.id === selectedCreateCategoryId,
    )
      ? selectedCreateCategoryId
      : "";
  }, [categoriesWithTemplates, selectedCreateCategoryId]);

  const selectedCategoryTemplates = useMemo(
    () =>
      resolvedCreateCategoryId
        ? templatesByCategory[resolvedCreateCategoryId] ?? []
        : [],
    [resolvedCreateCategoryId, templatesByCategory],
  );
  // Keep the picker implementation available, but default to opening the full form directly.
  const shouldShowCreateCategoryGate = false;
  const createInitial = useMemo(() => {
    if (initial?.id) return initial;
    return {
      ...initial,
      categoryId: resolvedCreateCategoryId || undefined,
    };
  }, [initial, resolvedCreateCategoryId]);

  const setOpenState = useCallback(
    (nextOpen: boolean) => {
      if (!isOpenControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isOpenControlled, onOpenChange],
  );

  const openPopout = useCallback(() => {
    isClosingRef.current = false;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenState(true);
    requestAnimationFrame(() => setIsActive(true));
  }, [setOpenState]);

  const closePopout = useCallback(() => {
    isClosingRef.current = true;
    setIsActive(false);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setOpenState(false);
      isClosingRef.current = false;
      closeTimerRef.current = null;
      onClose?.();
    }, 190);
  }, [onClose, setOpenState]);

  useEffect(() => {
    if (!openOnMount || autoOpenDoneRef.current) return;
    autoOpenDoneRef.current = true;
    const timer = window.setTimeout(() => openPopout(), 0);
    return () => window.clearTimeout(timer);
  }, [openOnMount, openPopout]);

  useEffect(() => {
    const wasOpen = previousIsOpenRef.current;
    if (!wasOpen && isOpen && !isClosingRef.current) {
      const frame = window.requestAnimationFrame(() => setIsActive(true));
      previousIsOpenRef.current = isOpen;
      return () => window.cancelAnimationFrame(frame);
    }
    if (wasOpen && !isOpen) {
      isClosingRef.current = false;
      const frame = window.requestAnimationFrame(() => setIsActive(false));
      previousIsOpenRef.current = isOpen;
      return () => window.cancelAnimationFrame(frame);
    }
    previousIsOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopout();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closePopout, isOpen]);

  useEffect(() => {
    if (!isCategoryDropdownOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!pickerContainerRef.current) return;
      if (pickerContainerRef.current.contains(event.target as Node)) return;
      setIsCategoryDropdownOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [isCategoryDropdownOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  function handleCategorySelection(categoryId: string) {
    const category = categoryById.get(categoryId);
    if (!category) return;

    const isSelectable = selectableCategoryIds.has(category.id);
    const parentId = category.parentId || category.id;
    setSelectedParentCategoryId(parentId);
    if (isSelectable) {
      setSelectedCreateCategoryId(category.id);
      setCategorySearch(localizeCategoryName(category, locale));
    } else {
      setSelectedCreateCategoryId("");
      setCategorySearch(localizeCategoryName(category, locale));
    }
    setIsCategoryDropdownOpen(false);
  }

  return (
    <>
      {mode === "card" ? (
        !hideTrigger && (
          <CardLike>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold">{text.createListing}</p>
                <p className="text-sm text-muted-foreground">{text.openWhenNeeded}</p>
              </div>
              <Button type="button" onClick={openPopout} className="gap-2">
                <PlusCircle size={16} />
                {resolvedButtonLabel}
              </Button>
            </div>
          </CardLike>
        )
      ) : (
        !hideTrigger && (
          <Button
            type="button"
            onClick={openPopout}
            variant={buttonVariant}
            size={buttonSize}
            className={`gap-2 ${buttonClassName}`}
          >
            <PlusCircle size={16} />
            {resolvedButtonLabel}
          </Button>
        )
      )}

      <CreateListingModalShell
        isOpen={isOpen}
        isActive={isActive}
        closeLabel={text.closeCreateListingForm}
        onClose={closePopout}
      >
        <div
          className={`relative mx-auto flex max-h-[100dvh] w-full min-w-0 max-w-[760px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-background/98 shadow-[0_24px_64px_-36px_rgba(2,6,23,0.45)] transition-all duration-200 sm:max-h-[92dvh] sm:rounded-3xl ${
            isActive
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-2 scale-[0.99] opacity-0"
          }`}
        >
          <CreateListingModalHeader
            title={text.createNewListing}
            subtitle={text.fillAndPublish}
            closeLabel={text.close}
            onClose={closePopout}
          />

          <div className="flex-1 min-w-0 max-w-full overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-3 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
            {initial?.id ? (
              <ListingForm
                action={action}
                categories={categories}
                cities={cities}
                templatesByCategory={templatesByCategory}
                allowDraft={allowDraft}
                showPlanSelector={showPlanSelector}
                publishLabel={resolvedPublishLabel}
                paymentProvider={paymentProvider}
                initial={initial}
                locale={locale}
              />
            ) : shouldShowCreateCategoryGate ? (
              <CreateListingCategoryGate
                text={{
                  category: text.category,
                  subcategories: text.subcategories,
                  chooseCategoryTitle: text.chooseCategoryTitle,
                  chooseCategoryHint: text.chooseCategoryHint,
                  categorySearchLabel: text.categorySearchLabel,
                  categorySearchPlaceholder: text.categorySearchPlaceholder,
                  noCategoryMatch: text.noCategoryMatch,
                  noCategoriesAvailable: text.noCategoriesAvailable,
                  needsSubcategory: text.needsSubcategory,
                  noTemplatesForCategory: text.noTemplatesForCategory,
                }}
                locale={locale}
                pickerContainerRef={pickerContainerRef}
                categoryById={categoryById}
                categorySearch={categorySearch}
                isCategoryDropdownOpen={isCategoryDropdownOpen}
                displayedCategoryResults={displayedCategoryResults}
                safeActiveCategoryResultIndex={safeActiveCategoryResultIndex}
                selectedParentSubcategories={selectedParentSubcategories}
                categoriesWithTemplatesLength={categoriesWithTemplates.length}
                normalizedCategoryQuery={normalizedCategoryQuery}
                selectedCreateCategoryId={selectedCreateCategoryId}
                resolvedCreateCategoryId={resolvedCreateCategoryId}
                selectedCategoryTemplatesLength={selectedCategoryTemplates.length}
                onCategorySearchChange={(value) => {
                  setCategorySearch(value);
                  setIsCategoryDropdownOpen(true);
                }}
                onCategorySearchFocus={() => setIsCategoryDropdownOpen(true)}
                onCategorySearchKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setIsCategoryDropdownOpen(true);
                    if (displayedCategoryResults.length === 0) return;
                    setActiveCategoryResultIndex((previous) =>
                      Math.min(previous + 1, displayedCategoryResults.length - 1),
                    );
                    return;
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setIsCategoryDropdownOpen(true);
                    if (displayedCategoryResults.length === 0) return;
                    setActiveCategoryResultIndex((previous) => Math.max(previous - 1, 0));
                    return;
                  }
                  if (event.key === "Enter") {
                    if (!isCategoryDropdownOpen) return;
                    event.preventDefault();
                    const activeResult = displayedCategoryResults[safeActiveCategoryResultIndex];
                    if (!activeResult) return;
                    handleCategorySelection(activeResult.category.id);
                    return;
                  }
                  if (event.key === "Escape") {
                    setIsCategoryDropdownOpen(false);
                  }
                }}
                onCategoryResultHover={setActiveCategoryResultIndex}
                onCategorySelection={handleCategorySelection}
                onSetParentAndCategory={(parentId, categoryId) => {
                  setSelectedCreateCategoryId(categoryId);
                  setSelectedParentCategoryId(parentId);
                }}
              />
            ) : (
              <CreateListingWizardForm
                action={action}
                categories={categories}
                cities={cities}
                templatesByCategory={templatesByCategory}
                allowDraft={allowDraft}
                showPlanSelector={showPlanSelector}
                publishLabel={resolvedPublishLabel}
                paymentProvider={paymentProvider}
                initial={createInitial}
                locale={locale}
                serverError={resolvedServerError}
                serverErrorField={resolvedServerErrorField}
                defaultsSaved={queryDefaultsSaved}
                onPublished={() => closePopout()}
              />
            )}
          </div>
        </div>
      </CreateListingModalShell>
    </>
  );
}

function CardLike({ children }: { children: ReactNode }) {
  return <div className={`${uiSurface.cardStrong} border-primary/20 p-4`}>{children}</div>;
}
