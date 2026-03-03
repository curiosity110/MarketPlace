"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Currency, ListingCondition } from "@prisma/client";
import { CirclePlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicFieldsEditor } from "@/components/dynamic-fields-editor";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ListingImageUpload } from "@/components/listing-image-upload";
import { localizeCategoryName } from "@/lib/category-label";
import { MARKETPLACE_CURRENCIES } from "@/lib/currency";
import { DYNAMIC_FIELD_PREFIX } from "@/lib/listing-fields";
import { PHONE_COUNTRIES } from "@/lib/phone";

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
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

type PersistedCreateDraft = {
  categoryId: string;
  plan: ListingPlan;
  values: Record<string, string>;
};

const CREATE_FORM_STORAGE_KEY = "mkd:create-listing-form:v1";
const MAX_CREATE_PHOTOS = 10;
const MAX_CREATE_SINGLE_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_CREATE_TOTAL_FILE_SIZE = 4 * 1024 * 1024; // 4MB

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  cities: City[];
  templatesByCategory: Record<string, Template[]>;
  allowDraft?: boolean;
  showPlanSelector?: boolean;
  publishLabel?: string;
  paymentProvider?: "none" | "stripe-dummy";
  existingImages?: { id: string; url: string }[];
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

export function ListingForm({
  action,
  categories,
  cities,
  templatesByCategory,
  allowDraft = true,
  showPlanSelector = true,
  publishLabel,
  paymentProvider = "none",
  existingImages = [],
  initial,
  locale = "en",
}: Props) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        subscriptionCharge: "Претплата (месечно)",
        perPostCharge: "Наплата по оглас (30 дена)",
        restoringDraft: "Се вчитува зачуваниот нацрт...",
        listingDetails: "Детали за оглас",
        title: "Наслов",
        titlePlaceholder: "Пример: Volkswagen Golf 7 2017",
        condition: "Состојба",
        categoryFields: "Полиња на категорија",
        categoryAndLocation: "Категорија и локација",
        pricingAndLocation: "Cena i lokacija",
        categoryPriority: "Prvo izberi kategorija za poprecizni filtri.",
        selectedCategory: "Izbrana kategorija",
        requestCategory: "Побарај категорија",
        price: "Цена",
        pricePlaceholder: "Цена",
        currency: "Валута",
        description: "Опис",
        descriptionPlaceholder:
          "Опиши состојба, карактеристики, испорака и услови за плаќање.",
        category: "Категорија",
        mainCategory: "Главна категорија",
        subcategory: "Поткатегорија",
        allSubcategories: "Сите поткатегории",
        useParentCategory: "Без поткатегорија (користи главна)",
        city: "Град",
        noCityAvailable: "Нема достапен град",
        conditionNew: "Ново",
        conditionUsed: "Користено",
        conditionRefurbished: "Рефурбиширано",
        sellerPhoneForPost: "Телефон за овој оглас",
        useDifferentPhone: "Користи друг телефон за овој оглас",
        useSavedPhone: "Користи зачуван телефон",
        usingSavedPhone: "Се користи зачуван телефон",
        country: "Држава",
        phone: "Телефон",
        phonePlaceholder: "Внеси телефонски број",
        acceptedPhoneFormat:
          "Прифатен формат: локален, +држава или 00држава.",
        photos: "Фотографии",
        photosHint: "Можеш да прикачиш до 10 слики веднаш при креирање.",
        photosCountError: "Mozes da prikacis najmnogu 10 sliki.",
        photosSingleSizeError: "Sekoja slika mora da e 4MB ili pomalku.",
        photosTotalSizeError: "Vkupnata golemina na sliki treba da bide do 4MB.",
        sellerPackage: "Пакет за продавач",
        gptIncluded: "GPT вклучен",
        payPerListing: "Плаќање по оглас",
        daysActive30: "30 дена активно",
        subscription: "Претплата",
        monthlyUnlimited: "месечно, неограничени огласи",
        secureCheckout: "Безбедно плаќање",
        paymentAfterPublish: "Плаќањето се појавува откако ќе кликнеш објави.",
        saveDraft: "Зачувај нацрт",
        payAndPublish: "Плати $",
        publishSuffix: " / Објави",
        stripeValidated:
          "Dummy Stripe плаќањето се проверува пред активирање.",
        closePaymentPopup: "Затвори прозорец за плаќање",
        close: "Затвори",
        cardNumber: "Број на картичка",
        expiry: "Важи до",
        cvc: "CVC",
        cardholder: "Носител на картичка",
        cardholderPlaceholder: "Тест корисник",
        successFailCards:
          "Успешна картичка: 4242424242424242. Неуспешна: 4000000000000002.",
        cancel: "Откажи",
      }
    : {
        subscriptionCharge: "Subscription charge (monthly)",
        perPostCharge: "Per post charge (30 days)",
        restoringDraft: "Restoring your saved listing draft...",
        listingDetails: "Listing details",
        title: "Title",
        titlePlaceholder: "Example: Volkswagen Golf 7 2017",
        condition: "Condition",
        categoryFields: "Category fields",
        categoryAndLocation: "Category and location",
        pricingAndLocation: "Pricing and location",
        categoryPriority: "Pick category first for smarter field suggestions.",
        selectedCategory: "Selected category",
        requestCategory: "Request category",
        price: "Price",
        pricePlaceholder: "Price",
        currency: "Currency",
        description: "Description",
        descriptionPlaceholder:
          "Describe condition, features, delivery, and payment terms.",
        category: "Category",
        mainCategory: "Main category",
        subcategory: "Subcategory",
        allSubcategories: "All subcategories",
        useParentCategory: "No subcategory (use main)",
        city: "City",
        noCityAvailable: "No city available",
        conditionNew: "New",
        conditionUsed: "Used",
        conditionRefurbished: "Refurbished",
        sellerPhoneForPost: "Seller phone for this post",
        useDifferentPhone: "Use different phone for this post",
        useSavedPhone: "Use saved phone",
        usingSavedPhone: "Using saved phone",
        country: "Country",
        phone: "Phone",
        phonePlaceholder: "Enter phone number",
        acceptedPhoneFormat:
          "Accepted format: local, +country, or 00country.",
        photos: "Photos",
        photosHint: "You can upload up to 10 images directly while creating.",
        photosCountError: "You can upload up to 10 images.",
        photosSingleSizeError: "Each image must be 4MB or smaller.",
        photosTotalSizeError: "Total image size must be 4MB or less.",
        sellerPackage: "Seller package",
        gptIncluded: "GPT included",
        payPerListing: "Pay per listing",
        daysActive30: "30 days active",
        subscription: "Subscription",
        monthlyUnlimited: "monthly, unlimited listings",
        secureCheckout: "Secure checkout",
        paymentAfterPublish: "Payment appears only after you press publish.",
        saveDraft: "Save draft",
        payAndPublish: "Pay $",
        publishSuffix: " / Publish",
        stripeValidated:
          "Stripe dummy payment is validated before activation.",
        closePaymentPopup: "Close payment popup",
        close: "Close",
        cardNumber: "Card number",
        expiry: "Expiry",
        cvc: "CVC",
        cardholder: "Cardholder",
        cardholderPlaceholder: "Test User",
        successFailCards:
          "Success card: 4242424242424242. Fail card: 4000000000000002.",
        cancel: "Cancel",
      };
  const formId = useId();
  const resolvedPublishLabel =
    publishLabel ?? (locale === "mk" ? "Објави оглас" : "Publish listing");
  const isCreateMode = !initial?.id;
  const formRef = useRef<HTMLFormElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);

  const categoryById = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [category.id, category]),
      ) as Record<string, Category>,
    [categories],
  );
  const parentCategories = useMemo(() => {
    const parentOnly = categories.filter((category) => !category.parentId);
    return parentOnly.length > 0 ? parentOnly : categories;
  }, [categories]);
  const subcategoriesByParentId = useMemo(() => {
    const grouped: Record<string, Category[]> = {};
    categories.forEach((category) => {
      if (!category.parentId) return;
      if (!grouped[category.parentId]) grouped[category.parentId] = [];
      grouped[category.parentId].push(category);
    });
    return grouped;
  }, [categories]);

  const initialCategory = initial?.categoryId ?? categories[0]?.id ?? "";
  const initialCategoryRecord = categoryById[initialCategory];
  const defaultParentCategoryId = initialCategoryRecord?.parentId
    ? initialCategoryRecord.parentId
    : initialCategoryRecord?.id || parentCategories[0]?.id || "";
  const defaultSubcategoryId = initialCategoryRecord?.parentId
    ? initialCategoryRecord.id
    : "";
  const hasSavedProfilePhone = Boolean((initial?.phone ?? "").trim());
  const [parentCategoryId, setParentCategoryId] = useState(
    defaultParentCategoryId,
  );
  const [subcategoryId, setSubcategoryId] = useState(defaultSubcategoryId);
  const [phoneCountry, setPhoneCountry] = useState(
    initial?.phoneCountry ?? "MK",
  );
  const [useSavedPhone, setUseSavedPhone] = useState(hasSavedProfilePhone);
  const [plan, setPlan] = useState<ListingPlan>(
    initial?.plan ?? "pay-per-listing",
  );
  const [isRestored, setIsRestored] = useState(!isCreateMode);
  const [restoredValues, setRestoredValues] = useState<Record<string, string>>(
    {},
  );
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(
    null,
  );

  const paymentAmount = plan === "subscription" ? 30 : 4;
  const paymentLabel =
    plan === "subscription"
      ? text.subscriptionCharge
      : text.perPostCharge;
  const requiresDummyPayment = paymentProvider === "stripe-dummy";

  const selectedCategoryId = subcategoryId || parentCategoryId;
  const subcategoriesForSelectedParent = useMemo(
    () => subcategoriesByParentId[parentCategoryId] ?? [],
    [parentCategoryId, subcategoriesByParentId],
  );
  const selectedCategoryPath = useMemo(() => {
    const parent = categoryById[parentCategoryId];
    const selected = categoryById[selectedCategoryId];
    if (!selected) return "";
    if (selected.parentId && parent) {
      return `${localizeCategoryName(parent, locale)} / ${localizeCategoryName(selected, locale)}`;
    }
    return localizeCategoryName(selected, locale);
  }, [categoryById, locale, parentCategoryId, selectedCategoryId]);
  const conditionLabelByValue: Record<ListingCondition, string> = {
    NEW: text.conditionNew,
    USED: text.conditionUsed,
    REFURBISHED: text.conditionRefurbished,
  };

  const categorySlugById = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [category.id, category.slug]),
      ),
    [categories],
  );

  const validateCreatePhotos = useCallback(
    (files: FileList | null) => {
      if (!isCreateMode || !files || files.length === 0) return null;
      if (files.length > MAX_CREATE_PHOTOS) return text.photosCountError;

      let totalBytes = 0;
      for (const file of Array.from(files)) {
        totalBytes += file.size;
        if (file.size > MAX_CREATE_SINGLE_FILE_SIZE) {
          return text.photosSingleSizeError;
        }
      }

      if (totalBytes > MAX_CREATE_TOTAL_FILE_SIZE) {
        return text.photosTotalSizeError;
      }

      return null;
    },
    [isCreateMode, text.photosCountError, text.photosSingleSizeError, text.photosTotalSizeError],
  );

  useEffect(() => {
    if (!subcategoryId) return;
    if (!subcategoriesForSelectedParent.some((item) => item.id === subcategoryId)) {
      setSubcategoryId("");
    }
  }, [subcategoryId, subcategoriesForSelectedParent]);

  const dynamicInitialValues = useMemo(() => {
    const base = { ...(initial?.dynamicValues ?? {}) };
    if (!isCreateMode) return base;

    Object.entries(restoredValues).forEach(([key, value]) => {
      if (!key.startsWith(DYNAMIC_FIELD_PREFIX)) return;
      base[key.slice(DYNAMIC_FIELD_PREFIX.length)] = value;
    });
    return base;
  }, [initial?.dynamicValues, isCreateMode, restoredValues]);

  const restoredCondition = useMemo(() => {
    if (!isCreateMode) return initial?.condition ?? ListingCondition.USED;
    const value = restoredValues.condition as ListingCondition | undefined;
    return Object.values(ListingCondition).includes(
      value || ListingCondition.USED,
    )
      ? value || ListingCondition.USED
      : ListingCondition.USED;
  }, [initial?.condition, isCreateMode, restoredValues.condition]);

  const restoredCityId = useMemo(() => {
    if (!isCreateMode) return initial?.cityId ?? cities[0]?.id;
    const value = restoredValues.cityId;
    if (value && cities.some((city) => city.id === value)) return value;
    return initial?.cityId ?? cities[0]?.id;
  }, [cities, initial?.cityId, isCreateMode, restoredValues.cityId]);

  const restoredCurrency = useMemo(() => {
    if (!isCreateMode) return initial?.currency ?? Currency.MKD;
    const value = restoredValues.currency as Currency | undefined;
    if (value === Currency.MKD || value === Currency.EUR) return value;
    return initial?.currency ?? Currency.MKD;
  }, [initial?.currency, isCreateMode, restoredValues.currency]);

  const readValue = useCallback(
    (key: string, fallback = "") => {
      if (isCreateMode && key in restoredValues) return restoredValues[key];
      return fallback;
    },
    [isCreateMode, restoredValues],
  );

  const persistDraft = useCallback(() => {
    if (!isCreateMode || !formRef.current || typeof window === "undefined")
      return;

    const formData = new FormData(formRef.current);
    const values: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      if (
        key === "photo" ||
        key === "photos" ||
        key === "intent" ||
        key === "id"
      )
        continue;
      if (typeof value === "string") values[key] = value;
    }

    values.categoryId = selectedCategoryId;
    values.plan = plan;

    const payload: PersistedCreateDraft = {
      categoryId: selectedCategoryId,
      plan,
      values,
    };

    window.localStorage.setItem(
      CREATE_FORM_STORAGE_KEY,
      JSON.stringify(payload),
    );
  }, [isCreateMode, plan, selectedCategoryId]);

  useEffect(() => {
    if (!isCreateMode || typeof window === "undefined") return;

    const raw = window.localStorage.getItem(CREATE_FORM_STORAGE_KEY);
    if (!raw) {
      setIsRestored(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedCreateDraft;
      const nextValues = parsed?.values ?? {};
      setRestoredValues(nextValues);

      const nextCategory =
        parsed.categoryId || nextValues.categoryId || initial?.categoryId;
      if (
        nextCategory &&
        categories.some((category) => category.id === nextCategory)
      ) {
        const selected = categoryById[nextCategory];
        if (selected?.parentId) {
          setParentCategoryId(selected.parentId);
          setSubcategoryId(selected.id);
        } else {
          setParentCategoryId(nextCategory);
          setSubcategoryId("");
        }
      }

      if (parsed.plan === "subscription" || parsed.plan === "pay-per-listing") {
        setPlan(parsed.plan);
      }

      const parsedCountry = parsed.values?.phoneCountry;
      if (
        parsedCountry &&
        PHONE_COUNTRIES.some((country) => country.code === parsedCountry)
      ) {
        setPhoneCountry(parsedCountry);
      }

      if (hasSavedProfilePhone && parsed.values?.useSavedPhone === "false") {
        setUseSavedPhone(false);
      }

      if (
        parsed.values?.dummyCardNumber ||
        parsed.values?.dummyCardExp ||
        parsed.values?.dummyCardCvc
      ) {
        setShowPaymentPanel(true);
      }
    } catch {
      window.localStorage.removeItem(CREATE_FORM_STORAGE_KEY);
    } finally {
      setIsRestored(true);
    }
  }, [
    categories,
    categoryById,
    hasSavedProfilePhone,
    initial?.categoryId,
    isCreateMode,
  ]);

  useEffect(() => {
    if (!isCreateMode || !isRestored) return;
    persistDraft();
  }, [
    isCreateMode,
    isRestored,
    parentCategoryId,
    persistDraft,
    phoneCountry,
    plan,
    selectedCategoryId,
    subcategoryId,
  ]);

  useEffect(() => {
    if (!showPaymentPanel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowPaymentPanel(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showPaymentPanel]);

  if (!isRestored) {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
        {text.restoringDraft}
      </div>
    );
  }

  return (
    <form
      id={formId}
      ref={formRef}
      action={action}
      encType="multipart/form-data"
      className="space-y-4"
      onChange={() => {
        if (isCreateMode) persistDraft();
      }}
      onSubmit={(event) => {
        const photosError = validateCreatePhotos(photosInputRef.current?.files ?? null);
        setPhotoValidationError(photosError);
        if (photosError) {
          event.preventDefault();
          return;
        }

        if (isCreateMode) persistDraft();
      }}
    >
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="plan" value={plan} />
      {paymentProvider !== "none" && (
        <input type="hidden" name="paymentProvider" value={paymentProvider} />
      )}

      <section className="grid items-start gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <h3 className="text-lg font-semibold">{text.listingDetails}</h3>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
            <div className="grid gap-3">
              <label className="space-y-1">
                <span className="text-sm font-medium">{text.title}</span>
                <Input
                  name="title"
                  defaultValue={readValue("title", initial?.title ?? "")}
                  placeholder={text.titlePlaceholder}
                  required
                  minLength={5}
                  maxLength={120}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">{text.condition}</span>
                <Select name="condition" defaultValue={restoredCondition}>
                  {Object.values(ListingCondition).map((condition) => (
                    <option key={condition} value={condition}>
                      {conditionLabelByValue[condition]}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <div className="space-y-2 rounded-xl border border-primary/30 bg-orange-50/70 p-3 dark:bg-orange-500/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{text.categoryAndLocation}</h3>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <CirclePlus size={13} />
                  {text.requestCategory}
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">{text.categoryPriority}</p>

              <input type="hidden" name="categoryId" value={selectedCategoryId} />

              <div className="grid gap-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {text.mainCategory}
                  </span>
                  <Select
                    value={parentCategoryId}
                    onChange={(event) => {
                      setParentCategoryId(event.target.value);
                      setSubcategoryId("");
                    }}
                    required
                  >
                    {parentCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {localizeCategoryName(category, locale)}
                      </option>
                    ))}
                  </Select>
                </label>

                {subcategoriesForSelectedParent.length > 0 && (
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {text.subcategory}
                    </span>
                    <Select
                      value={subcategoryId}
                      onChange={(event) => setSubcategoryId(event.target.value)}
                    >
                      <option value="">{text.useParentCategory}</option>
                      {subcategoriesForSelectedParent.map((category) => (
                        <option key={category.id} value={category.id}>
                          {localizeCategoryName(category, locale)}
                        </option>
                      ))}
                    </Select>
                  </label>
                )}
              </div>

              <div className="rounded-lg border border-primary/20 bg-card/70 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {text.selectedCategory}
                </p>
                <p className="text-sm font-semibold">{selectedCategoryPath}</p>
              </div>
            </div>
          </div>
          <h3 className="text-base font-semibold">{text.categoryFields}</h3>
          <DynamicFieldsEditor
            key={selectedCategoryId}
            categoryId={selectedCategoryId}
            categorySlugById={categorySlugById}
            templatesByCategory={templatesByCategory}
            initialValues={dynamicInitialValues}
            locale={locale}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <h3 className="text-lg font-semibold">{text.pricingAndLocation}</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">{text.price}</span>
              <Input
                type="number"
                step="1"
                min="1"
                name="price"
                defaultValue={readValue("price", String(initial?.price ?? 0))}
                placeholder={text.pricePlaceholder}
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">{text.currency}</span>
              <Select name="currency" defaultValue={restoredCurrency}>
                {MARKETPLACE_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-sm font-medium">{text.description}</span>
            <textarea
              name="description"
              defaultValue={readValue(
                "description",
                initial?.description ?? "",
              )}
              className="min-h-32 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder={text.descriptionPlaceholder}
              maxLength={2000}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {text.city}
            </span>
            <Select name="cityId" defaultValue={restoredCityId} required>
              {cities.length === 0 ? (
                <option value="" disabled>
                  {text.noCityAvailable}
                </option>
              ) : (
                cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))
              )}
            </Select>
          </label>

          <div className="space-y-2 rounded-xl border border-border/70 bg-card/90 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{text.sellerPhoneForPost}</p>
              {hasSavedProfilePhone && (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={() => setUseSavedPhone((prev) => !prev)}
                >
                  {useSavedPhone
                    ? text.useDifferentPhone
                    : text.useSavedPhone}
                </button>
              )}
            </div>
            <input
              type="hidden"
              name="useSavedPhone"
              value={String(useSavedPhone)}
            />

            {hasSavedProfilePhone && useSavedPhone ? (
              <>
                <input
                  type="hidden"
                  name="phoneCountry"
                  value={initial?.phoneCountry ?? phoneCountry}
                />
                <input
                  type="hidden"
                  name="phone"
                  value={initial?.phone ?? ""}
                />
                <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    {text.usingSavedPhone}
                  </p>
                  <p className="text-sm font-semibold leading-none">
                    {initial?.phoneCountry || "MK"} {initial?.phone}
                  </p>
                </div>
              </>
            ) : (
              <div className="grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {text.country}
                  </span>
                  <Select
                    name="phoneCountry"
                    value={phoneCountry}
                    onChange={(event) => setPhoneCountry(event.target.value)}
                  >
                    {PHONE_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.label} (+{country.dialCode})
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {text.phone}
                  </span>
                  <Input
                    name="phone"
                    defaultValue={readValue("phone", initial?.phone ?? "")}
                    placeholder={text.phonePlaceholder}
                    required
                    minLength={6}
                    maxLength={20}
                    inputMode="tel"
                    autoComplete="tel"
                    pattern="[0-9+()\\-\\s]{6,20}"
                  />
                </label>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              {text.acceptedPhoneFormat}
            </p>
          </div>

          {!initial?.id && (
            <div className="rounded-xl border border-border/70 bg-card/90 p-3">
              <label className="space-y-1">
                <span className="text-sm font-medium">{text.photos}</span>
                <input
                  ref={photosInputRef}
                  type="file"
                  name="photos"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={(event) => {
                    const nextError = validateCreatePhotos(event.target.files);
                    setPhotoValidationError(nextError);
                  }}
                  className="block w-full rounded-xl border border-border bg-input px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                {text.photosHint}
              </p>
              {photoValidationError && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  {photoValidationError}
                </p>
              )}
            </div>
          )}

          {initial?.id && (
            <div className="rounded-xl border border-border/70 bg-card/90 p-3">
              <ListingImageUpload
                listingId={initial.id}
                existingImages={existingImages}
                locale={locale}
              />
            </div>
          )}
        </div>
      </section>

      {showPlanSelector && (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">{text.sellerPackage}</h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">
              <Sparkles size={13} />
              {text.gptIncluded}
            </span>
          </div>

          <div className="grid gap-2.5 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setPlan("pay-per-listing")}
              className={`rounded-2xl border p-3 text-left transition-colors ${
                plan === "pay-per-listing"
                  ? "border-primary bg-orange-50/70 dark:bg-orange-500/10"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <p className="text-sm font-semibold">{text.payPerListing}</p>
              <p className="text-2xl font-black text-primary">$4</p>
              <p className="text-xs text-muted-foreground">{text.daysActive30}</p>
            </button>

            <button
              type="button"
              onClick={() => setPlan("subscription")}
              className={`rounded-2xl border p-3 text-left transition-colors ${
                plan === "subscription"
                  ? "border-secondary bg-blue-50/70 dark:bg-blue-500/10"
                  : "border-border bg-card hover:border-secondary/30"
              }`}
            >
              <p className="text-sm font-semibold">{text.subscription}</p>
              <p className="text-2xl font-black text-secondary">$30</p>
              <p className="text-xs text-muted-foreground">
                {text.monthlyUnlimited}
              </p>
            </button>
          </div>

          {requiresDummyPayment && (
            <div className="rounded-xl border border-border/70 bg-card p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {text.secureCheckout}
              </p>
              <p className="mt-1 text-sm">
                {text.paymentAfterPublish}{" "}
                <span className="font-semibold">
                  ${paymentAmount} {paymentLabel.toLowerCase()}.
                </span>
              </p>
            </div>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {allowDraft && (
          <Button
            name="intent"
            value="draft"
            type="submit"
            variant="outline"
            disabled={showPaymentPanel || Boolean(photoValidationError)}
          >
            {text.saveDraft}
          </Button>
        )}
        {requiresDummyPayment ? (
          <Button
            type="button"
            disabled={Boolean(photoValidationError)}
            onClick={() => setShowPaymentPanel(true)}
          >
            {text.payAndPublish}
            {paymentAmount}
            {text.publishSuffix}
          </Button>
        ) : (
          <Button
            name="intent"
            value="publish"
            type="submit"
            disabled={Boolean(photoValidationError)}
          >
            {resolvedPublishLabel}
          </Button>
        )}
      </div>

      {isCreateMode && showPlanSelector && requiresDummyPayment && (
        <p className="text-xs text-muted-foreground">
          {text.stripeValidated}
        </p>
      )}

      {requiresDummyPayment && (
        <div
          className={`fixed inset-0 z-[95] flex items-center justify-center p-3 transition-all duration-200 ${
            showPaymentPanel
              ? "pointer-events-auto visible opacity-100"
              : "pointer-events-none invisible opacity-0"
          }`}
          aria-hidden={!showPaymentPanel}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.target instanceof HTMLElement) {
              if (event.target.tagName !== "TEXTAREA") {
                event.preventDefault();
              }
            }
          }}
        >
          <button
            type="button"
            aria-label={text.closePaymentPopup}
            onClick={() => setShowPaymentPanel(false)}
            className="absolute inset-0 bg-black/45"
          />

          <div className="relative z-[1] w-full max-w-lg rounded-2xl border border-border/70 bg-card p-4 shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {text.secureCheckout}
                </p>
                <p className="text-2xl font-black">${paymentAmount}</p>
                <p className="text-sm text-muted-foreground">{paymentLabel}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowPaymentPanel(false)}
              >
                {text.close}
              </Button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <label className="space-y-1 sm:col-span-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {text.cardNumber}
                </span>
                <Input
                  name="dummyCardNumber"
                  defaultValue={readValue("dummyCardNumber", "")}
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  pattern="[0-9 ]{16,23}"
                  required={showPaymentPanel}
                  disabled={!showPaymentPanel}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {text.expiry}
                </span>
                <Input
                  name="dummyCardExp"
                  defaultValue={readValue("dummyCardExp", "")}
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                  required={showPaymentPanel}
                  disabled={!showPaymentPanel}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {text.cvc}
                </span>
                <Input
                  name="dummyCardCvc"
                  defaultValue={readValue("dummyCardCvc", "")}
                  placeholder="CVC"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  pattern="[0-9]{3,4}"
                  required={showPaymentPanel}
                  disabled={!showPaymentPanel}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {text.cardholder}
                </span>
                <Input
                  name="dummyCardName"
                  defaultValue={readValue("dummyCardName", "")}
                  placeholder={text.cardholderPlaceholder}
                  autoComplete="cc-name"
                  minLength={2}
                  maxLength={80}
                  required={showPaymentPanel}
                  disabled={!showPaymentPanel}
                />
              </label>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {text.successFailCards}
            </p>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentPanel(false)}
              >
                {text.cancel}
              </Button>
              <Button
                name="intent"
                value="publish"
                type="submit"
                disabled={Boolean(photoValidationError)}
              >
                {resolvedPublishLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

