"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PlusCircle, X } from "lucide-react";
import { Currency, ListingCondition } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { CreateListingWizardForm } from "@/components/create-listing-wizard-form";
import { ListingForm } from "@/components/listing-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { localizeCategoryName } from "@/lib/category-label";

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
  onClose,
  initial,
  locale = "en",
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        createListing: "Креирај оглас",
        openWhenNeeded: "Отвори ја формата кога ти треба.",
        closeCreateListingForm: "Затвори форма за креирање оглас",
        createNewListing: "Креирај нов оглас",
        fillAndPublish: "Пополни во 3 чекори: основи, фотографии и детали.",
        close: "Затвори",
      }
    : {
        createListing: "Create listing",
        openWhenNeeded: "Open the form only when you need it.",
        closeCreateListingForm: "Close create listing form",
        createNewListing: "Create a new listing",
        fillAndPublish: "Complete 3 steps: photos, basics, and details.",
        close: "Close",
      };
  const resolvedButtonLabel = buttonLabel ?? (isMk ? "Нов оглас" : "New listing");
  const resolvedPublishLabel =
    publishLabel ?? (isMk ? "Објави оглас" : "Publish listing");
  const chooseCategoryTitle = isMk
    ? "Choose category for this listing"
    : "Choose category for this listing";
  const chooseCategoryHint = isMk
    ? "Pick a category first, then the form will load with the correct fields."
    : "Pick a category first, then the form will load with the correct fields.";
  const categoryLabel = isMk ? "Category" : "Category";
  const categorySearchLabel = isMk ? "Search category" : "Search category";
  const categorySearchPlaceholder = isMk
    ? "Ex. Cars, Phones..."
    : "Ex. Cars, Phones...";
  const chooseCategoryOption = isMk ? "Select category" : "Select category";
  const noCategoriesAvailable = isMk
    ? "No categories are currently available for posting."
    : "No categories are currently available for posting.";
  const noCategoryMatch = isMk
    ? "No categories match this search."
    : "No categories match this search.";
  const noTemplatesForCategory = isMk
    ? "This category has no templates yet. Choose another category."
    : "This category has no templates yet. Choose another category.";
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const autoOpenDoneRef = useRef(false);
  const [categorySearch, setCategorySearch] = useState("");

  const queryCategoryId = searchParams.get("cat");
  const queryHasValidCategory = useMemo(
    () =>
      Boolean(
        queryCategoryId &&
          categories.some((category) => category.id === queryCategoryId),
      ),
    [categories, queryCategoryId],
  );
  const requiresExplicitCategorySelection =
    !initial?.id && pathname === "/sell" && !queryHasValidCategory;
  const [selectedCreateCategoryId, setSelectedCreateCategoryId] = useState(
    () => {
      if (initial?.id || requiresExplicitCategorySelection) return "";
      const initialCategoryId = initial?.categoryId;
      if (
        initialCategoryId &&
        categories.some((category) => category.id === initialCategoryId)
      ) {
        return initialCategoryId;
      }
      return "";
    },
  );

  const categoriesWithTemplates = useMemo(
    () =>
      categories.filter(
        (category) => (templatesByCategory[category.id]?.length ?? 0) > 0,
      ),
    [categories, templatesByCategory],
  );
  const filteredCategories = useMemo(() => {
    const normalizedQuery = categorySearch.trim().toLowerCase();
    if (!normalizedQuery) return categoriesWithTemplates;
    return categoriesWithTemplates.filter((category) => {
      const localizedName = localizeCategoryName(category, locale).toLowerCase();
      return (
        localizedName.includes(normalizedQuery) ||
        category.name.toLowerCase().includes(normalizedQuery) ||
        category.slug.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [categoriesWithTemplates, categorySearch, locale]);
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
  const shouldShowCreateCategoryGate =
    !initial?.id &&
    (!resolvedCreateCategoryId || selectedCategoryTemplates.length === 0);
  const createInitial = useMemo(() => {
    if (initial?.id) return initial;
    return {
      ...initial,
      categoryId: resolvedCreateCategoryId || undefined,
    };
  }, [initial, resolvedCreateCategoryId]);

  const openPopout = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(() => setIsActive(true));
  }, []);

  const closePopout = useCallback(() => {
    setIsActive(false);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      onClose?.();
    }, 190);
  }, [onClose]);

  useEffect(() => {
    if (!openOnMount || autoOpenDoneRef.current) return;
    autoOpenDoneRef.current = true;
    const timer = window.setTimeout(() => openPopout(), 0);
    return () => window.clearTimeout(timer);
  }, [openOnMount, openPopout]);

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
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <>
      {mode === "card" ? (
        !hideTrigger && (
          <CardLike>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold">{text.createListing}</p>
                <p className="text-sm text-muted-foreground">
                  {text.openWhenNeeded}
                </p>
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

      {isOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-0 sm:p-4 sm:pt-5"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label={text.closeCreateListingForm}
            onClick={closePopout}
            className={`absolute inset-0 bg-black/45 transition-opacity duration-200 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />

          <div
            className={`relative mx-auto flex min-h-dvh w-full max-w-[980px] flex-col border border-border bg-background shadow-2xl transition-all duration-200 sm:min-h-[92vh] sm:rounded-3xl ${
              isActive
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-2 scale-[0.99] opacity-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-6 sm:py-4">
              <div>
                <p className="text-lg font-black sm:text-2xl">{text.createNewListing}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {text.fillAndPublish}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={closePopout} className="gap-1">
                <X size={15} />
                {text.close}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
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
                <section className="mx-auto w-full max-w-xl space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5">
                  <div className="space-y-1">
                    <p className="text-base font-bold">{chooseCategoryTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {chooseCategoryHint}
                    </p>
                  </div>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {categorySearchLabel}
                    </span>
                    <Input
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
                      placeholder={categorySearchPlaceholder}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {categoryLabel}
                    </span>
                    <Select
                      value={resolvedCreateCategoryId}
                      onChange={(event) =>
                        setSelectedCreateCategoryId(event.target.value)
                      }
                    >
                      <option value="" disabled>
                        {chooseCategoryOption}
                      </option>
                      {filteredCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {localizeCategoryName(category, locale)}
                        </option>
                      ))}
                    </Select>
                  </label>

                  {categoriesWithTemplates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {noCategoriesAvailable}
                    </p>
                  ) : filteredCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {noCategoryMatch}
                    </p>
                  ) : null}

                  {resolvedCreateCategoryId &&
                  selectedCategoryTemplates.length === 0 ? (
                    <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {noTemplatesForCategory}
                    </p>
                  ) : null}
                </section>
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
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CardLike({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-4">
      {children}
    </div>
  );
}
