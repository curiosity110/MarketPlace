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
import { localizeCategoryName } from "@/lib/category-label";

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  [key: string]: unknown;
};
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

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreCategoryQuery(searchText: string, query: string, tokens: string[]) {
  if (!searchText) return 0;
  if (searchText === query) return 140;
  if (searchText.startsWith(query)) return 110;
  if (searchText.includes(` ${query}`)) return 95;
  if (searchText.includes(query)) return 82;
  if (tokens.length > 1 && tokens.every((token) => searchText.includes(token))) {
    return 74 + Math.min(tokens.length, 6);
  }
  return 0;
}

function collectAllLabelStrings(input: unknown, out: Set<string>) {
  if (!input) return;
  if (typeof input === "string") {
    out.add(input);
    return;
  }
  if (Array.isArray(input)) {
    input.forEach((value) => collectAllLabelStrings(value, out));
    return;
  }
  if (typeof input === "object") {
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      if (
        typeof value === "string" &&
        /(name|label|title|locale|translation|i18n|en|mk)/i.test(key)
      ) {
        out.add(value);
      } else if (
        value &&
        typeof value === "object" &&
        /(name|label|title|locale|translation|i18n)/i.test(key)
      ) {
        collectAllLabelStrings(value, out);
      }
    });
  }
}

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
  serverError,
  serverErrorField,
}: Props) {
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
        createListing: "Креирај оглас",
        openWhenNeeded: "Отвори ја формата кога ти треба.",
        closeCreateListingForm: "Затвори форма за креирање оглас",
        createNewListing: "Креирај нов оглас",
        fillAndPublish: "Пополнување во 3 чекори: фотографии, основи и детали.",
        close: "Затвори",
        chooseCategoryTitle: "Избери категорија",
        chooseCategoryHint:
          "Избери категорија за да се вчитаат точните полиња за објавување.",
        categorySearchLabel: "Брзо пребарување",
        categorySearchPlaceholder: "Почни да пишуваш (пр. кола, авто, cars)",
        category: "Категорија",
        subcategories: "Поткатегории",
        noCategoriesAvailable: "Нема достапни категории за објава.",
        noCategoryMatch: "Нема совпаѓања за ова пребарување.",
        noTemplatesForCategory:
          "Оваа категорија нема полиња за објава. Избери друга.",
        needsSubcategory: "Избери поткатегорија за продолжување.",
      }
    : {
        createListing: "Create listing",
        openWhenNeeded: "Open the form only when you need it.",
        closeCreateListingForm: "Close create listing form",
        createNewListing: "Create a new listing",
        fillAndPublish: "Complete 3 steps: photos, basics, and details.",
        close: "Close",
        chooseCategoryTitle: "Choose category",
        chooseCategoryHint:
          "Pick a category first so the form loads with the correct templates.",
        categorySearchLabel: "Live category search",
        categorySearchPlaceholder: "Start typing (ex. cars, авто, кола)",
        category: "Category",
        subcategories: "Subcategories",
        noCategoriesAvailable: "No categories are currently available for posting.",
        noCategoryMatch: "No categories match this search.",
        noTemplatesForCategory:
          "This category has no listing fields yet. Choose another.",
        needsSubcategory: "Choose a subcategory to continue.",
      };

  const resolvedButtonLabel = buttonLabel ?? (isMk ? "Нов оглас" : "New listing");
  const resolvedPublishLabel =
    publishLabel ?? (isMk ? "Објави оглас" : "Publish listing");
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
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
        const normalizedSearchText = normalizeSearchText(
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

  const normalizedCategoryQuery = normalizeSearchText(categorySearch);
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
        score: scoreCategoryQuery(
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
              <Button
                type="button"
                variant="outline"
                onClick={closePopout}
                className="gap-1"
              >
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
                    <p className="text-base font-bold">{text.chooseCategoryTitle}</p>
                    <p className="text-sm text-muted-foreground">{text.chooseCategoryHint}</p>
                  </div>

                  <div className="space-y-1" ref={pickerContainerRef}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {text.categorySearchLabel}
                    </span>
                    <div className="relative">
                      <Input
                        value={categorySearch}
                        onFocus={() => setIsCategoryDropdownOpen(true)}
                        onChange={(event) => {
                          setCategorySearch(event.target.value);
                          setIsCategoryDropdownOpen(true);
                        }}
                        onKeyDown={(event) => {
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
                            setActiveCategoryResultIndex((previous) =>
                              Math.max(previous - 1, 0),
                            );
                            return;
                          }
                          if (event.key === "Enter") {
                            if (!isCategoryDropdownOpen) return;
                            event.preventDefault();
                            const activeResult =
                              displayedCategoryResults[safeActiveCategoryResultIndex];
                            if (!activeResult) return;
                            handleCategorySelection(activeResult.category.id);
                            return;
                          }
                          if (event.key === "Escape") {
                            setIsCategoryDropdownOpen(false);
                          }
                        }}
                        placeholder={text.categorySearchPlaceholder}
                      />

                      {isCategoryDropdownOpen && (
                        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border/80 bg-card p-1 shadow-lg">
                          {displayedCategoryResults.length === 0 ? (
                            <p className="px-2 py-2 text-sm text-muted-foreground">
                              {text.noCategoryMatch}
                            </p>
                          ) : (
                            displayedCategoryResults.map((entry, index) => {
                              const parentLabel = entry.category.parentId
                                ? localizeCategoryName(
                                    categoryById.get(entry.category.parentId),
                                    locale,
                                  )
                                : "";
                              const isActive = safeActiveCategoryResultIndex === index;
                              return (
                                <button
                                  key={`picker-result-${entry.category.id}`}
                                  type="button"
                                  className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                                    isActive
                                      ? "bg-primary/10 text-foreground"
                                      : "hover:bg-muted/60"
                                  }`}
                                  onMouseEnter={() => setActiveCategoryResultIndex(index)}
                                  onClick={() => handleCategorySelection(entry.category.id)}
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate font-medium">
                                      {entry.localizedName}
                                    </span>
                                    {parentLabel ? (
                                      <span className="block truncate text-xs text-muted-foreground">
                                        {parentLabel}
                                      </span>
                                    ) : null}
                                  </span>
                                  {!entry.selectable && entry.hasSelectableChildren ? (
                                    <span className="rounded-full border border-border/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                      {text.subcategories}
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedParentSubcategories.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {text.subcategories}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedParentSubcategories.map((subcategory) => (
                          <button
                            key={`subcategory-${subcategory.id}`}
                            type="button"
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              selectedCreateCategoryId === subcategory.id
                                ? "border-primary/50 bg-primary/10"
                                : "border-border/70 bg-card hover:border-primary/35"
                            }`}
                            onClick={() => {
                              setSelectedCreateCategoryId(subcategory.id);
                              setSelectedParentCategoryId(subcategory.parentId || subcategory.id);
                            }}
                          >
                            {localizeCategoryName(subcategory, locale)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {categoriesWithTemplates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {text.noCategoriesAvailable}
                    </p>
                  ) : normalizedCategoryQuery && displayedCategoryResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{text.noCategoryMatch}</p>
                  ) : null}

                  {!resolvedCreateCategoryId && selectedParentSubcategories.length > 0 ? (
                    <p className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground">
                      {text.needsSubcategory}
                    </p>
                  ) : null}

                  {selectedCreateCategoryId && selectedCategoryTemplates.length === 0 ? (
                    <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {text.noTemplatesForCategory}
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
                  serverError={resolvedServerError}
                  serverErrorField={resolvedServerErrorField}
                  defaultsSaved={queryDefaultsSaved}
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
  return <div className="rounded-2xl border border-primary/20 bg-card p-4">{children}</div>;
}
