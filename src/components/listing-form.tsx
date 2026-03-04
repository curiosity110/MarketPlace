"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Currency, ListingCondition } from "@prisma/client";
import { CirclePlus, Sparkles, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicFieldsEditor } from "@/components/dynamic-fields-editor";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ListingImageUpload } from "@/components/listing-image-upload";
import { localizeCategoryName } from "@/lib/category-label";
import { MARKETPLACE_CURRENCIES } from "@/lib/currency";
import { DYNAMIC_FIELD_PREFIX } from "@/lib/listing-fields";
import { PHONE_COUNTRIES } from "@/lib/phone";
import {
  analyzeListingPhotos,
  type ListingPhotoSuggestions,
} from "@/lib/actions/analyze-listing-photos";

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

function readStoredCreateDraft(): PersistedCreateDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CREATE_FORM_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedCreateDraft;
    if (!parsed || typeof parsed !== "object") {
      window.localStorage.removeItem(CREATE_FORM_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(CREATE_FORM_STORAGE_KEY);
    return null;
  }
}

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
        savedDraftDetected: "Пронајдовме локален зачуван нацрт на овој уред.",
        restoreSavedDraft: "Вчитај нацрт",
        discardSavedDraft: "Избриши нацрт",
        listingDetails: "Детали за оглас",
        title: "Наслов",
        titlePlaceholder: "Пример: Volkswagen Golf 7 2017",
        condition: "Состојба",
        categoryFields: "Полиња на категорија",
        categoryFieldsExpand: "Прикажи полиња за категорија",
        categoryAndLocation: "Категорија и локација",
        pricingAndLocation: "Цена и локација",
        categoryPriority: "Прво избери категорија за попрецизни филтри.",
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
        photosCountError: "Можеш да прикачиш најмногу 10 слики.",
        photosSingleSizeError: "Секоја слика мора да е 4MB или помалку.",
        photosTotalSizeError: "Вкупната големина на слики треба да биде до 4MB.",
        sellerPackage: "Пакет за продавач",
        assistantIncluded: "Assistant included",
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
        stepBasics: "Чекор 1 · Основи",
        stepPhotos: "Чекор 2 · Фотографии",
        stepDetails: "Чекор 3 · Детали",
        smartFill: "Паметно пополнување од фотографии",
        smartFillHint: "Добиј предлози од избраните фотографии. Ништо не се зачувува автоматски.",
        runSmartFill: "Анализирај фотографии",
        runningSmartFill: "Се анализира...",
        noSuggestionsYet: "Сè уште нема предлози.",
        suggestionsReady: "Предлозите се подготвени. Примени ги поединечно.",
        apply: "Примени",
        suggestedCategory: "Предложена категорија",
        suggestedBrand: "Предложена марка",
        suggestedModel: "Предложен модел",
        suggestedYear: "Предложена година",
        nextStep: "Следен чекор",
        previousStep: "Назад",
        reviewAndPublish: "Преглед и објавување",
      }
    : {
        subscriptionCharge: "Subscription charge (monthly)",
        perPostCharge: "Per post charge (30 days)",
        savedDraftDetected: "A locally saved draft was found on this device.",
        restoreSavedDraft: "Restore draft",
        discardSavedDraft: "Discard draft",
        listingDetails: "Listing details",
        title: "Title",
        titlePlaceholder: "Example: Volkswagen Golf 7 2017",
        condition: "Condition",
        categoryFields: "Category fields",
        categoryFieldsExpand: "Show category fields",
        categoryAndLocation: "Category and location",
        pricingAndLocation: "Pricing and location",
        categoryPriority: "Pick category first for smarter field suggestions.",
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
        assistantIncluded: "Assistant included",
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
        stepBasics: "Step 1 · Basics",
        stepPhotos: "Step 2 · Photos",
        stepDetails: "Step 3 · Details",
        smartFill: "Smart Fill from Photos",
        smartFillHint: "Get optional suggestions from selected photos. Nothing is auto-saved.",
        runSmartFill: "Analyze photos",
        runningSmartFill: "Analyzing...",
        noSuggestionsYet: "No suggestions yet.",
        suggestionsReady: "Suggestions are ready. Apply them one by one.",
        apply: "Apply",
        suggestedCategory: "Suggested category",
        suggestedBrand: "Suggested brand",
        suggestedModel: "Suggested model",
        suggestedYear: "Suggested year",
        nextStep: "Next step",
        previousStep: "Back",
        reviewAndPublish: "Review & publish",
      };
  const resetDraftAndFormLabel = isMk ? "Ресетирај форма" : "Reset form";
  const assistantIncludedLabel = isMk ? "Паметен асистент" : "Smart assistant";
  const formId = useId();
  const resolvedPublishLabel =
    publishLabel ?? (locale === "mk" ? "Објави оглас" : "Publish listing");
  const isCreateMode = !initial?.id;
  const formRef = useRef<HTMLFormElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const conditionSelectRef = useRef<HTMLSelectElement | null>(null);

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
  const [restoredValues, setRestoredValues] = useState<Record<string, string>>(
    {},
  );
  const [savedDraft, setSavedDraft] = useState<PersistedCreateDraft | null>(
    readStoredCreateDraft,
  );
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(
    null,
  );
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [smartFillSuggestions, setSmartFillSuggestions] =
    useState<ListingPhotoSuggestions>({});
  const [isAnalyzingPhotos, startAnalyzingPhotos] = useTransition();

  const paymentAmount = plan === "subscription" ? 30 : 4;
  const paymentLabel =
    plan === "subscription"
      ? text.subscriptionCharge
      : text.perPostCharge;
  const requiresDummyPayment = paymentProvider === "stripe-dummy";

  const subcategoriesForSelectedParent = useMemo(
    () => subcategoriesByParentId[parentCategoryId] ?? [],
    [parentCategoryId, subcategoriesByParentId],
  );
  const hasValidSubcategory =
    Boolean(subcategoryId) &&
    subcategoriesForSelectedParent.some((item) => item.id === subcategoryId);
  const selectedCategoryId = (hasValidSubcategory ? subcategoryId : "") || parentCategoryId;
  const conditionLabelByValue: Record<ListingCondition, string> = {
    NEW: text.conditionNew,
    USED: text.conditionUsed,
    REFURBISHED: text.conditionRefurbished,
  };

  function validateCreatePhotos(files: FileList | null) {
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
  }

  function applySuggestionToField(name: string, value: string) {
    const field = formRef.current?.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
      field.value = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function applySuggestionToDynamicField(key: string, value: string) {
    applySuggestionToField(`${DYNAMIC_FIELD_PREFIX}${key}`, value);
  }

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

  function clearPersistedDraft() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CREATE_FORM_STORAGE_KEY);
    setSavedDraft(null);
  }

  function restoreSavedDraft() {
    if (!savedDraft) return;

    const nextValues = savedDraft.values ?? {};
    setRestoredValues(nextValues);

    const nextCategory =
      savedDraft.categoryId || nextValues.categoryId || initial?.categoryId;
    if (nextCategory && categories.some((category) => category.id === nextCategory)) {
      const selected = categoryById[nextCategory];
      if (selected?.parentId) {
        setParentCategoryId(selected.parentId);
        setSubcategoryId(selected.id);
      } else {
        setParentCategoryId(nextCategory);
        setSubcategoryId("");
      }
    }

    if (savedDraft.plan === "subscription" || savedDraft.plan === "pay-per-listing") {
      setPlan(savedDraft.plan);
    }

    const parsedCountry = savedDraft.values?.phoneCountry;
    if (
      parsedCountry &&
      PHONE_COUNTRIES.some((country) => country.code === parsedCountry)
    ) {
      setPhoneCountry(parsedCountry);
    }

    if (hasSavedProfilePhone && savedDraft.values?.useSavedPhone === "false") {
      setUseSavedPhone(false);
    }

    if (
      savedDraft.values?.dummyCardNumber ||
      savedDraft.values?.dummyCardExp ||
      savedDraft.values?.dummyCardCvc
    ) {
      setShowPaymentPanel(true);
    }

    setSavedDraft(null);
  }

  function resetCreateDraftAndForm() {
    if (!isCreateMode) return;
    clearPersistedDraft();
    setRestoredValues({});
    setParentCategoryId(defaultParentCategoryId);
    setSubcategoryId(defaultSubcategoryId);
    setPhoneCountry(initial?.phoneCountry ?? "MK");
    setUseSavedPhone(hasSavedProfilePhone);
    setPlan(initial?.plan ?? "pay-per-listing");
    setPhotoValidationError(null);
    setCurrentStep(1);
    setSmartFillSuggestions({});
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPhotoPreviews([]);
    setShowPaymentPanel(false);
    if (photosInputRef.current) {
      photosInputRef.current.value = "";
    }
    formRef.current?.reset();
  }

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

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  return (
    <form
      id={formId}
      ref={formRef}
      action={action}
      encType="multipart/form-data"
      className="space-y-4"
      onSubmit={(event) => {
        const photosError = validateCreatePhotos(photosInputRef.current?.files ?? null);
        setPhotoValidationError(photosError);
        if (photosError) {
          event.preventDefault();
          return;
        }

        const submitter =
          event.nativeEvent instanceof SubmitEvent
            ? event.nativeEvent.submitter
            : null;
        const intent =
          submitter instanceof HTMLButtonElement ||
          submitter instanceof HTMLInputElement
            ? submitter.value
            : "publish";

        if (!isCreateMode) return;
        if (intent === "draft") {
          persistDraft();
          return;
        }

        clearPersistedDraft();
      }}
    >
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="plan" value={plan} />
      {paymentProvider !== "none" && (
        <input type="hidden" name="paymentProvider" value={paymentProvider} />
      )}
      {isCreateMode && savedDraft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary/30 bg-blue-50/50 p-3 dark:bg-blue-500/10">
          <p className="text-sm text-foreground">{text.savedDraftDetected}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={restoreSavedDraft}>
              {text.restoreSavedDraft}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearPersistedDraft}
            >
              {text.discardSavedDraft}
            </Button>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-muted/20 p-2">
          {[text.stepBasics, text.stepPhotos, text.stepDetails].map((label, index) => {
            const step = (index + 1) as 1 | 2 | 3;
            const isActiveStep = currentStep === step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setCurrentStep(step)}
                className={`rounded-xl px-2 py-2 text-left text-xs font-semibold transition sm:text-sm ${
                  isActiveStep
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-card/70"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className={`grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] ${currentStep === 1 ? "" : "hidden"}`}>
            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <h3 className="text-lg font-semibold">{text.stepBasics}</h3>

              <label className="space-y-1">
                <span className="text-sm font-medium">{text.title}</span>
                <Input
                  ref={titleInputRef}
                  name="title"
                  defaultValue={readValue("title", initial?.title ?? "")}
                  placeholder={text.titlePlaceholder}
                  required
                  minLength={5}
                  maxLength={120}
                  autoComplete="off"
                />
              </label>

              <div className="space-y-2 rounded-xl border border-primary/30 bg-orange-50/70 p-3 dark:bg-orange-500/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{text.categoryAndLocation}</h3>
                  <Link
                    href="/categories#request-category"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <CirclePlus size={13} />
                    {text.requestCategory}
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">{text.categoryPriority}</p>

                <input type="hidden" name="categoryId" value={selectedCategoryId} />

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {text.mainCategory}
                    </span>
                    <Select
                      name="parentCategoryId"
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

                  {subcategoriesForSelectedParent.length > 0 ? (
                    <label className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {text.subcategory}
                      </span>
                      <Select
                        name="subcategoryId"
                        value={hasValidSubcategory ? subcategoryId : ""}
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
                  ) : (
                    <p className="text-[11px] text-muted-foreground sm:self-end">
                      {text.subcategory}: 0
                    </p>
                  )}
                </div>
              </div>

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
                    autoComplete="off"
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

              <div className="grid gap-3 sm:grid-cols-2">
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

                <label className="space-y-1">
                  <span className="text-sm font-medium">{text.condition}</span>
                  <Select ref={conditionSelectRef} name="condition" defaultValue={restoredCondition}>
                    {Object.values(ListingCondition).map((condition) => (
                      <option key={condition} value={condition}>
                        {conditionLabelByValue[condition]}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            </div>

            <aside className="hidden rounded-2xl border border-border/70 bg-card p-4 lg:block">
              <h3 className="text-sm font-semibold">{text.categoryAndLocation}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text.categoryPriority}</p>
            </aside>
          </div>

        {currentStep === 2 && (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <h3 className="text-lg font-semibold">{text.stepPhotos}</h3>
            {!initial?.id ? (
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
                      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
                      const previews = Array.from(event.target.files ?? []).map((file) =>
                        URL.createObjectURL(file),
                      );
                      setPhotoPreviews(previews);
                    }}
                    className="block w-full rounded-xl border border-border bg-input px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium"
                  />
                </label>
                <p className="mt-1 text-xs text-muted-foreground">{text.photosHint}</p>
                {photoValidationError && (
                  <p className="mt-1 text-xs font-medium text-destructive">{photoValidationError}</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 bg-card/90 p-3">
                <ListingImageUpload
                  listingId={initial.id}
                  existingImages={existingImages}
                  locale={locale}
                />
              </div>
            )}

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {photoPreviews.map((preview, index) => (
                  <img
                    key={preview}
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="aspect-square w-full rounded-xl border border-border/70 object-cover"
                  />
                ))}
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-border/70 bg-card/90 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{text.smartFill}</p>
                  <p className="text-xs text-muted-foreground">{text.smartFillHint}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1"
                  disabled={isAnalyzingPhotos}
                  onClick={() => {
                    startAnalyzingPhotos(async () => {
                      const files = Array.from(photosInputRef.current?.files ?? []);
                      const suggestions = await analyzeListingPhotos(files);
                      setSmartFillSuggestions(suggestions);
                    });
                  }}
                >
                  <WandSparkles size={14} />
                  {isAnalyzingPhotos ? text.runningSmartFill : text.runSmartFill}
                </Button>
              </div>

              {Object.keys(smartFillSuggestions).length === 0 ? (
                <p className="text-xs text-muted-foreground">{text.noSuggestionsYet}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{text.suggestionsReady}</p>
                  {smartFillSuggestions.suggestedTitle && (
                    <SuggestionRow
                      label={text.title}
                      value={smartFillSuggestions.suggestedTitle}
                      onApply={() => applySuggestionToField("title", smartFillSuggestions.suggestedTitle || "")}
                      applyLabel={text.apply}
                    />
                  )}
                  {smartFillSuggestions.suggestedDescription && (
                    <SuggestionRow
                      label={text.description}
                      value={smartFillSuggestions.suggestedDescription}
                      onApply={() => {
                        if (descriptionInputRef.current) {
                          descriptionInputRef.current.value = smartFillSuggestions.suggestedDescription || "";
                          descriptionInputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
                        }
                      }}
                      applyLabel={text.apply}
                    />
                  )}
                  {smartFillSuggestions.suggestedCondition && (
                    <SuggestionRow
                      label={text.condition}
                      value={conditionLabelByValue[smartFillSuggestions.suggestedCondition]}
                      onApply={() =>
                        applySuggestionToField("condition", smartFillSuggestions.suggestedCondition || "USED")
                      }
                      applyLabel={text.apply}
                    />
                  )}
                  {smartFillSuggestions.suggestedCategorySlug && (
                    <SuggestionRow
                      label={text.suggestedCategory}
                      value={smartFillSuggestions.suggestedCategorySlug}
                      onApply={() => {
                        const matched = categories.find((category) => category.slug === smartFillSuggestions.suggestedCategorySlug);
                        if (!matched) return;
                        if (matched.parentId) {
                          setParentCategoryId(matched.parentId);
                          setSubcategoryId(matched.id);
                        } else {
                          setParentCategoryId(matched.id);
                          setSubcategoryId("");
                        }
                      }}
                      applyLabel={text.apply}
                    />
                  )}
                  {smartFillSuggestions.suggestedBrand && (
                    <SuggestionRow
                      label={text.suggestedBrand}
                      value={smartFillSuggestions.suggestedBrand}
                      onApply={() => applySuggestionToDynamicField("brand", smartFillSuggestions.suggestedBrand || "")}
                      applyLabel={text.apply}
                    />
                  )}
                  {smartFillSuggestions.suggestedModel && (
                    <SuggestionRow
                      label={text.suggestedModel}
                      value={smartFillSuggestions.suggestedModel}
                      onApply={() => applySuggestionToDynamicField("model", smartFillSuggestions.suggestedModel || "")}
                      applyLabel={text.apply}
                    />
                  )}
                  {smartFillSuggestions.suggestedYear && (
                    <SuggestionRow
                      label={text.suggestedYear}
                      value={smartFillSuggestions.suggestedYear}
                      onApply={() => applySuggestionToDynamicField("year", smartFillSuggestions.suggestedYear || "")}
                      applyLabel={text.apply}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <h3 className="text-lg font-semibold">{text.reviewAndPublish}</h3>

            <label className="space-y-1">
              <span className="text-sm font-medium">{text.description}</span>
              <textarea
                ref={descriptionInputRef}
                name="description"
                defaultValue={readValue("description", initial?.description ?? "")}
                className="min-h-36 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder={text.descriptionPlaceholder}
                maxLength={2000}
                autoComplete="off"
              />
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
                    {useSavedPhone ? text.useDifferentPhone : text.useSavedPhone}
                  </button>
                )}
              </div>
              <input type="hidden" name="useSavedPhone" value={String(useSavedPhone)} />

              {hasSavedProfilePhone && useSavedPhone ? (
                <>
                  <input type="hidden" name="phoneCountry" value={initial?.phoneCountry ?? phoneCountry} />
                  <input type="hidden" name="phone" value={initial?.phone ?? ""} />
                  <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{text.usingSavedPhone}</p>
                    <p className="text-sm font-semibold leading-none">{initial?.phoneCountry || "MK"} {initial?.phone}</p>
                  </div>
                </>
              ) : (
                <div className="grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">{text.country}</span>
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
                    <span className="text-xs font-medium text-muted-foreground">{text.phone}</span>
                    <Input
                      name="phone"
                      defaultValue={readValue("phone", initial?.phone ?? "")}
                      placeholder={text.phonePlaceholder}
                      required
                      minLength={6}
                      maxLength={20}
                      inputMode="tel"
                      autoComplete="tel"
                      pattern="[0-9+()\-\s]{6,20}"
                    />
                  </label>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">{text.acceptedPhoneFormat}</p>
            </div>

            <details className="rounded-xl border border-border/70 bg-card/90 p-3" open>
              <summary className="cursor-pointer text-sm font-semibold">{text.categoryFieldsExpand}</summary>
              <div className="mt-3">
                <DynamicFieldsEditor
                  key={selectedCategoryId}
                  categoryId={selectedCategoryId}
                  templatesByCategory={templatesByCategory}
                  initialValues={dynamicInitialValues}
                  locale={locale}
                />
              </div>
            </details>
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))}
          >
            {text.previousStep}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={currentStep === 3}
            onClick={() => setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev))}
          >
            {text.nextStep}
          </Button>
        </div>
      </section>

      {showPlanSelector && (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">{text.sellerPackage}</h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">
              <Sparkles size={13} />
              {assistantIncludedLabel}
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
        {isCreateMode && (
          <Button
            type="button"
            variant="outline"
            onClick={resetCreateDraftAndForm}
            disabled={showPaymentPanel}
          >
            {resetDraftAndFormLabel}
          </Button>
        )}
        {allowDraft && (
          <Button
            name="intent"
            value="draft"
            type="submit"
            variant="outline"
            disabled={showPaymentPanel || Boolean(photoValidationError)}
            onClick={() => {
              if (isCreateMode) persistDraft();
            }}
          >
            {text.saveDraft}
          </Button>
        )}
        {requiresDummyPayment ? (
          <Button
            type="button"
            disabled={Boolean(photoValidationError) || currentStep !== 3}
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
            disabled={Boolean(photoValidationError) || currentStep !== 3}
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
                disabled={Boolean(photoValidationError) || currentStep !== 3}
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

function SuggestionRow({
  label,
  value,
  onApply,
  applyLabel,
}: {
  label: string;
  value: string;
  onApply: () => void;
  applyLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/30 px-2 py-1.5">
      <p className="text-xs">
        <span className="font-semibold">{label}:</span> {value}
      </p>
      <Button type="button" size="sm" variant="secondary" onClick={onApply}>
        {applyLabel}
      </Button>
    </div>
  );
}
