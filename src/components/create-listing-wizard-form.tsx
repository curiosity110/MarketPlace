"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Currency, ListingCondition } from "@prisma/client";
import { ChevronLeft, ChevronRight, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicFieldsEditor } from "@/components/dynamic-fields-editor";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { localizeCategoryName } from "@/lib/category-label";
import { MARKETPLACE_CURRENCIES } from "@/lib/currency";
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

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  cities: City[];
  templatesByCategory: Record<string, Template[]>;
  allowDraft?: boolean;
  showPlanSelector?: boolean;
  publishLabel?: string;
  paymentProvider?: "none" | "stripe-dummy";
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
  locale?: "en" | "mk";
};

const MAX_CREATE_PHOTOS = 10;
const MAX_CREATE_SINGLE_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_CREATE_TOTAL_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export function CreateListingWizardForm({
  action,
  categories,
  cities,
  templatesByCategory,
  allowDraft = true,
  showPlanSelector = true,
  publishLabel,
  paymentProvider = "none",
  initial,
  locale = "en",
}: Props) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        createListing: "Креирај оглас",
        photos: "Фотографии",
        basics: "Основи",
        details: "Детали",
        back: "Назад",
        continue: "Продолжи",
        publish: "Објави",
        close: "Затвори",
        title: "Наслов",
        titlePlaceholder: "Пример: Volkswagen Golf 7 2017",
        titleRequired: "Насловот е задолжителен.",
        description: "Опис",
        descriptionPlaceholder:
          "Опиши состојба, карактеристики, испорака и услови за плаќање.",
        photoHint: "Додади до 10 фотографии. Вкупно максимум 4MB.",
        photosCountError: "Можеш да прикачиш најмногу 10 слики.",
        photosSingleSizeError: "Секоја слика мора да е 4MB или помалку.",
        photosTotalSizeError: "Вкупната големина на слики треба да биде до 4MB.",
        category: "Категорија",
        categorySearch: "Пребарај категорија",
        categorySearchPlaceholder: "Пр. Автомобили, Телефони...",
        categoryRequired: "Избери категорија.",
        noCategoryMatch: "Нема совпаѓање за пребарувањето.",
        city: "Град",
        cityRequired: "Избери град.",
        noCityAvailable: "Нема достапен град",
        price: "Цена",
        pricePlaceholder: "Цена",
        priceRequired: "Цената мора да биде поголема од 0.",
        currency: "Валута",
        condition: "Состојба",
        conditionNew: "Ново",
        conditionUsed: "Користено",
        conditionRefurbished: "Рефурбиширано",
        phone: "Телефон",
        phoneRequired: "Телефонскиот број е задолжителен.",
        phonePlaceholder: "Внеси телефонски број",
        country: "Држава",
        acceptedPhoneFormat: "Прифатен формат: локален, +држава или 00држава.",
        categoryFields: "Полиња на категорија",
        review: "Преглед",
        reviewTitle: "Наслов",
        reviewCategory: "Категорија",
        reviewPrice: "Цена",
        reviewCity: "Град",
        reviewCondition: "Состојба",
        reviewPhotos: "Фотографии",
        reviewPhone: "Телефон",
        noValue: "Н/Д",
        saveDraft: "Зачувај нацрт",
        sellerPackage: "Пакет за продавач",
        payPerListing: "Плаќање по оглас",
        daysActive30: "30 дена активно",
        subscription: "Претплата",
        monthlyUnlimited: "месечно, неограничени огласи",
        secureCheckout: "Безбедно плаќање",
        paymentAfterPublish: "Плаќањето се појавува откако ќе кликнеш објави.",
        payAndPublish: "Плати $",
        publishSuffix: " / Објави",
        stripeValidated:
          "Dummy Stripe плаќањето се проверува пред активирање.",
        closePaymentPopup: "Затвори прозорец за плаќање",
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
        createListing: "Create listing",
        photos: "Photos",
        basics: "Basics",
        details: "Details",
        back: "Back",
        continue: "Continue",
        publish: "Publish",
        close: "Close",
        title: "Title",
        titlePlaceholder: "Example: Volkswagen Golf 7 2017",
        titleRequired: "Title is required.",
        description: "Description",
        descriptionPlaceholder:
          "Describe condition, features, delivery, and payment terms.",
        photoHint: "Add up to 10 photos. Total maximum 4MB.",
        photosCountError: "You can upload up to 10 images.",
        photosSingleSizeError: "Each image must be 4MB or smaller.",
        photosTotalSizeError: "Total image size must be 4MB or less.",
        category: "Category",
        categorySearch: "Search category",
        categorySearchPlaceholder: "Ex. Cars, Phones...",
        categoryRequired: "Select a category.",
        noCategoryMatch: "No categories match this search.",
        city: "City",
        cityRequired: "Select a city.",
        noCityAvailable: "No city available",
        price: "Price",
        pricePlaceholder: "Price",
        priceRequired: "Price must be greater than 0.",
        currency: "Currency",
        condition: "Condition",
        conditionNew: "New",
        conditionUsed: "Used",
        conditionRefurbished: "Refurbished",
        phone: "Phone",
        phoneRequired: "Phone number is required.",
        phonePlaceholder: "Enter phone number",
        country: "Country",
        acceptedPhoneFormat: "Accepted format: local, +country, or 00country.",
        categoryFields: "Category fields",
        review: "Review",
        reviewTitle: "Title",
        reviewCategory: "Category",
        reviewPrice: "Price",
        reviewCity: "City",
        reviewCondition: "Condition",
        reviewPhotos: "Photos",
        reviewPhone: "Phone",
        noValue: "N/A",
        saveDraft: "Save draft",
        sellerPackage: "Seller package",
        payPerListing: "Pay per listing",
        daysActive30: "30 days active",
        subscription: "Subscription",
        monthlyUnlimited: "monthly, unlimited listings",
        secureCheckout: "Secure checkout",
        paymentAfterPublish: "Payment appears only after you press publish.",
        payAndPublish: "Pay $",
        publishSuffix: " / Publish",
        stripeValidated:
          "Stripe dummy payment is validated before activation.",
        closePaymentPopup: "Close payment popup",
        cardNumber: "Card number",
        expiry: "Expiry",
        cvc: "CVC",
        cardholder: "Cardholder",
        cardholderPlaceholder: "Test User",
        successFailCards:
          "Success card: 4242424242424242. Fail card: 4000000000000002.",
        cancel: "Cancel",
      };

  const resolvedPublishLabel = publishLabel ?? text.publish;
  const requiresDummyPayment = paymentProvider === "stripe-dummy";
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(null);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [selectedPhotosCount, setSelectedPhotosCount] = useState(0);
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [plan, setPlan] = useState<ListingPlan>(
    initial?.plan ?? "pay-per-listing",
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? "",
  );
  const [categorySearch, setCategorySearch] = useState("");
  const [cityId, setCityId] = useState(initial?.cityId ?? cities[0]?.id ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [currency, setCurrency] = useState<Currency>(
    initial?.currency ?? Currency.MKD,
  );
  const [condition, setCondition] = useState<ListingCondition>(
    initial?.condition ?? ListingCondition.USED,
  );
  const [phoneCountry, setPhoneCountry] = useState(initial?.phoneCountry ?? "MK");
  const [phone, setPhone] = useState(initial?.phone ?? "");

  const paymentAmount = plan === "subscription" ? 30 : 4;
  const paymentLabel = plan === "subscription" ? text.subscription : text.payPerListing;
  const resolvedSelectedCategoryId = useMemo(() => {
    if (!categories.length) return "";
    if (
      selectedCategoryId &&
      categories.some((category) => category.id === selectedCategoryId)
    ) {
      return selectedCategoryId;
    }
    return categories[0]?.id ?? "";
  }, [categories, selectedCategoryId]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === resolvedSelectedCategoryId),
    [categories, resolvedSelectedCategoryId],
  );
  const selectedCity = useMemo(
    () => cities.find((city) => city.id === cityId),
    [cities, cityId],
  );
  const conditionLabelByValue: Record<ListingCondition, string> = {
    NEW: text.conditionNew,
    USED: text.conditionUsed,
    REFURBISHED: text.conditionRefurbished,
  };
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      localizeCategoryName(category, locale).toLowerCase().includes(query),
    );
  }, [categories, categorySearch, locale]);

  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviewUrls]);

  useEffect(() => {
    if (!showPaymentPanel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowPaymentPanel(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPaymentPanel]);

  function validateCreatePhotos(files: FileList | null) {
    if (!files || files.length === 0) return null;
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

  function refreshPhotoPreview(files: FileList | null) {
    setSelectedPhotosCount(files?.length ?? 0);
    setPhotoPreviewUrls((previous) => {
      previous.forEach((url) => URL.revokeObjectURL(url));
      if (!files || files.length === 0) return [];
      return Array.from(files).slice(0, 8).map((file) => URL.createObjectURL(file));
    });
  }

  function validateCurrentStep(step: number) {
    if (step === 1) {
      if (!title.trim()) return text.titleRequired;
      const photosError = validateCreatePhotos(photosInputRef.current?.files ?? null);
      setPhotoValidationError(photosError);
      if (photosError) return photosError;
      return null;
    }

    if (step === 2) {
      if (!resolvedSelectedCategoryId) return text.categoryRequired;
      if (!cityId) return text.cityRequired;
      if (!price.trim() || Number(price) <= 0) return text.priceRequired;
      return null;
    }

    if (!phone.trim()) return text.phoneRequired;
    return null;
  }

  function moveStep(direction: "next" | "back") {
    if (direction === "back") {
      setStepError(null);
      setCurrentStep((previous) => Math.max(1, previous - 1));
      return;
    }

    const error = validateCurrentStep(currentStep);
    if (error) {
      setStepError(error);
      return;
    }

    setStepError(null);
    setCurrentStep((previous) => Math.min(3, previous + 1));
  }

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="space-y-5 pb-24 md:space-y-6 md:pb-0"
      onSubmit={(event) => {
        const photosError = validateCreatePhotos(photosInputRef.current?.files ?? null);
        setPhotoValidationError(photosError);
        if (photosError) {
          event.preventDefault();
          setCurrentStep(1);
          setStepError(photosError);
          return;
        }
        setStepError(null);
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="condition" value={condition} />
      {paymentProvider !== "none" && (
        <input type="hidden" name="paymentProvider" value={paymentProvider} />
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 1, label: text.photos },
          { id: 2, label: text.basics },
          { id: 3, label: text.details },
        ].map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setCurrentStep(step.id)}
            className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold transition-colors sm:text-sm ${
              currentStep === step.id
                ? "border-primary/45 bg-primary/10 text-foreground"
                : currentStep > step.id
                  ? "border-secondary/30 bg-secondary/10 text-foreground"
                  : "border-border/70 bg-card text-muted-foreground"
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      {stepError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {stepError}
        </p>
      )}

      <section className={currentStep === 1 ? "space-y-4" : "hidden"}>
        <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-sm font-semibold">{text.photos}</p>
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center transition-colors hover:border-primary/35 hover:bg-primary/5">
            <ImagePlus size={24} className="text-primary" />
            <span className="text-sm font-medium text-foreground">{text.photoHint}</span>
            <input
              ref={photosInputRef}
              name="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const nextError = validateCreatePhotos(event.target.files);
                setPhotoValidationError(nextError);
                refreshPhotoPreview(event.target.files);
              }}
              className="sr-only"
            />
          </label>
          {photoValidationError && (
            <p className="text-xs font-medium text-destructive">{photoValidationError}</p>
          )}
          {photoPreviewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {photoPreviewUrls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/70 bg-muted/20"
                >
                  <Image
                    src={url}
                    alt={`Selected photo ${index + 1}`}
                    fill
                    unoptimized
                    sizes="180px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="space-y-1">
          <span className="text-sm font-medium">{text.title}</span>
          <Input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={text.titlePlaceholder}
            required
          />
        </label>
      </section>

      <section className={currentStep === 2 ? "space-y-4" : "hidden"}>
        <div className="space-y-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">{text.categorySearch}</span>
            <Input
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder={text.categorySearchPlaceholder}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">{text.category}</span>
            <Select
              name="categoryId"
              value={resolvedSelectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              required
            >
              {filteredCategories.length === 0 ? (
                <option value="" disabled>
                  {text.noCategoryMatch}
                </option>
              ) : (
                filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {localizeCategoryName(category, locale)}
                  </option>
                ))
              )}
            </Select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">{text.city}</span>
            <Select
              name="cityId"
              value={cityId}
              onChange={(event) => setCityId(event.target.value)}
              required
            >
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
            <span className="text-sm font-medium">{text.price}</span>
            <Input
              name="price"
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder={text.pricePlaceholder}
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">{text.currency}</span>
            <Select
              name="currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as Currency)}
            >
              {MARKETPLACE_CURRENCIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </label>

          <div className="space-y-1">
            <span className="text-sm font-medium">{text.condition}</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                ListingCondition.NEW,
                ListingCondition.USED,
                ListingCondition.REFURBISHED,
              ].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCondition(value)}
                  className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                    condition === value
                      ? "border-primary/45 bg-primary/10 text-foreground"
                      : "border-border/70 bg-card text-muted-foreground"
                  }`}
                >
                  {conditionLabelByValue[value]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={currentStep === 3 ? "space-y-4" : "hidden"}>
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-sm font-semibold">{text.details}</p>
          <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
            <label className="space-y-1">
              <span className="text-sm font-medium">{text.country}</span>
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
              <span className="text-sm font-medium">{text.phone}</span>
              <Input
                name="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
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
          <p className="text-xs text-muted-foreground">{text.acceptedPhoneFormat}</p>
        </div>

        <label className="space-y-1">
          <span className="text-sm font-medium">{text.description}</span>
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            placeholder={text.descriptionPlaceholder}
            className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </label>

        <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-sm font-semibold">{text.categoryFields}</p>
          <DynamicFieldsEditor
            key={resolvedSelectedCategoryId}
            categoryId={resolvedSelectedCategoryId}
            templatesByCategory={templatesByCategory}
            initialValues={initial?.dynamicValues}
            locale={locale}
          />
        </div>

        <div className="space-y-2 rounded-2xl border border-secondary/30 bg-blue-50/40 p-4 dark:bg-blue-500/10">
          <p className="text-sm font-semibold">{text.review}</p>
          <div className="grid gap-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{text.reviewTitle}: </span>
              {title.trim() || text.noValue}
            </p>
            <p>
              <span className="font-medium text-foreground">{text.reviewCategory}: </span>
              {selectedCategory ? localizeCategoryName(selectedCategory, locale) : text.noValue}
            </p>
            <p>
              <span className="font-medium text-foreground">{text.reviewPrice}: </span>
              {price.trim() || "0"} {currency}
            </p>
            <p>
              <span className="font-medium text-foreground">{text.reviewCity}: </span>
              {selectedCity?.name || text.noValue}
            </p>
            <p>
              <span className="font-medium text-foreground">{text.reviewCondition}: </span>
              {conditionLabelByValue[condition]}
            </p>
            <p>
              <span className="font-medium text-foreground">{text.reviewPhotos}: </span>
              {selectedPhotosCount}
            </p>
            <p>
              <span className="font-medium text-foreground">{text.reviewPhone}: </span>
              {phone.trim() ? `${phoneCountry} ${phone}` : text.noValue}
            </p>
          </div>
        </div>

        {showPlanSelector && (
          <section className="space-y-2 rounded-2xl border border-border/70 bg-card p-4">
            <h3 className="text-sm font-semibold">{text.sellerPackage}</h3>
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
                <p className="text-xs text-muted-foreground">{text.monthlyUnlimited}</p>
              </button>
            </div>

            {requiresDummyPayment && (
              <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {text.secureCheckout}
                </p>
                <p className="mt-1 text-sm">
                  {text.paymentAfterPublish}{" "}
                  <span className="font-semibold">${paymentAmount}.</span>
                </p>
              </div>
            )}
          </section>
        )}
      </section>

      <div className="hidden items-center justify-between gap-2 pt-2 md:flex">
        <Button
          type="button"
          variant="outline"
          onClick={() => moveStep("back")}
          className={currentStep === 1 ? "invisible" : ""}
        >
          <ChevronLeft size={16} />
          {text.back}
        </Button>

        {currentStep < 3 ? (
          <Button type="button" onClick={() => moveStep("next")}>
            {text.continue}
            <ChevronRight size={16} />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {allowDraft && (
              <Button name="intent" value="draft" type="submit" variant="outline">
                {text.saveDraft}
              </Button>
            )}
            {requiresDummyPayment ? (
              <Button type="button" onClick={() => setShowPaymentPanel(true)}>
                {text.payAndPublish}
                {paymentAmount}
                {text.publishSuffix}
              </Button>
            ) : (
              <Button name="intent" value="publish" type="submit">
                {resolvedPublishLabel}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border/70 bg-background/95 px-3 py-2 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => moveStep("back")}
            className={currentStep === 1 ? "invisible" : ""}
          >
            <ChevronLeft size={16} />
            {text.back}
          </Button>

          {currentStep < 3 ? (
            <Button type="button" onClick={() => moveStep("next")}>
              {text.continue}
              <ChevronRight size={16} />
            </Button>
          ) : requiresDummyPayment ? (
            <Button type="button" onClick={() => setShowPaymentPanel(true)}>
              {text.payAndPublish}
              {paymentAmount}
            </Button>
          ) : (
            <Button name="intent" value="publish" type="submit">
              {resolvedPublishLabel}
            </Button>
          )}
        </div>
      </div>

      {requiresDummyPayment && (
        <div
          className={`fixed inset-0 z-[95] flex items-center justify-center p-3 transition-all duration-200 ${
            showPaymentPanel
              ? "pointer-events-auto visible opacity-100"
              : "pointer-events-none invisible opacity-0"
          }`}
          aria-hidden={!showPaymentPanel}
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
                  placeholder={text.cardholderPlaceholder}
                  autoComplete="cc-name"
                  minLength={2}
                  maxLength={80}
                  required={showPaymentPanel}
                  disabled={!showPaymentPanel}
                />
              </label>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">{text.successFailCards}</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentPanel(false)}
              >
                {text.cancel}
              </Button>
              <Button name="intent" value="publish" type="submit">
                {resolvedPublishLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPlanSelector && requiresDummyPayment && (
        <p className="hidden text-xs text-muted-foreground md:block">{text.stripeValidated}</p>
      )}
    </form>
  );
}
