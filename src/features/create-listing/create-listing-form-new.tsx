"use client";

import {
  useActionState,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Currency, ListingCondition } from "@prisma/client";
import { CreateListingFeedback } from "@/components/create-listing/feedback";
import { getCreateListingWizardText } from "@/components/create-listing/messages";
import { CreateListingPaymentModal } from "@/components/create-listing/payment-modal";
import { validateCreateListingPhotos } from "@/components/create-listing/state/wizard-form.validation";
import { localizeCategoryName } from "@/lib/category-label";
import { DYNAMIC_FIELD_PREFIX } from "@/lib/listing-fields";
import { CreateListingHeader } from "@/features/create-listing/create-listing-header";
import { CreateListingStepDetails } from "@/features/create-listing/create-listing-step-details";
import { CreateListingStepPhotos } from "@/features/create-listing/create-listing-step-photos";
import { CreateListingStepPrice } from "@/features/create-listing/create-listing-step-price";
import { StickyPublishBar } from "@/features/create-listing/sticky-publish-bar";
import type {
  CreateListingCategoryOption,
  CreateListingCityOption,
  CreateListingInitialValues,
  CreateListingPaymentDraft,
  CreateListingPlanOption,
  CreateListingResult,
  CreateListingTemplateMap,
  CreateListingWizardStep,
} from "@/features/create-listing/types";
import {
  filterCreateListingCategories,
  getCreateListingInitialStep,
  getCreateListingModalText,
  getCreateListingPhoneCountryOptions,
  getCreateListingPrimaryTemplateKeys,
  getCreateListingStepMeta,
  resolveCreateJumpStep,
  resolveCreateNormalizedErrorField,
  resolveCreatePaymentAmount,
} from "@/features/create-listing/utils";

type Props = {
  action: (formData: FormData) => Promise<unknown> | unknown;
  categories: CreateListingCategoryOption[];
  cities: CreateListingCityOption[];
  templatesByCategory: CreateListingTemplateMap;
  allowDraft?: boolean;
  showPlanSelector?: boolean;
  publishLabel?: string;
  paymentProvider?: "none" | "stripe-dummy";
  initial?: CreateListingInitialValues;
  locale?: "en" | "mk";
  serverError?: string | null;
  serverErrorField?: string | null;
  defaultsSaved?: boolean;
  onPublished?: () => void;
  onClose: () => void;
};

export function CreateListingFormNew({
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
  serverError = null,
  serverErrorField = null,
  defaultsSaved = false,
  onPublished,
  onClose,
}: Props) {
  void allowDraft;

  const text = getCreateListingWizardText(locale);
  const modalText = getCreateListingModalText(locale);
  const resolvedPublishLabel = publishLabel ?? text.publish;
  const requiresDummyPayment = paymentProvider === "stripe-dummy";
  const phoneCountryOptions = getCreateListingPhoneCountryOptions();
  const formRef = useRef<HTMLFormElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const successTimerRef = useRef<number | null>(null);

  const [currentStep, setCurrentStep] = useState<CreateListingWizardStep>(() =>
    getCreateListingInitialStep({ serverError, serverErrorField }),
  );
  const [stepError, setStepError] = useState<string | null>(null);
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(null);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(serverError);
  const [serverErrorFieldState, setServerErrorFieldState] = useState<string | null>(
    serverErrorField,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [needsEditListingId, setNeedsEditListingId] = useState<string | null>(null);
  const [isClosingAfterSuccess, setIsClosingAfterSuccess] = useState(false);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(initial?.categoryId ?? "");
  const [categorySearch, setCategorySearch] = useState("");
  const [cityId, setCityId] = useState(initial?.cityId ?? cities[0]?.id ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? Currency.MKD);
  const [condition, setCondition] = useState<ListingCondition>(
    initial?.condition ?? ListingCondition.USED,
  );
  const [phoneCountry, setPhoneCountry] = useState(initial?.phoneCountry ?? "MK");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [plan, setPlan] = useState<CreateListingPlanOption>(
    initial?.plan ?? "pay-per-listing",
  );
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>(
    initial?.dynamicValues ?? {},
  );
  const [paymentDraft, setPaymentDraft] = useState<CreateListingPaymentDraft>({
    cardNumber: "",
    expiry: "",
    cvc: "",
    cardholder: "",
  });

  const deferredCategorySearch = useDeferredValue(categorySearch);
  const stepMeta = getCreateListingStepMeta(currentStep, {
    photos: text.photos,
    basics: text.basics,
    price: text.price,
  });

  const categoriesWithTemplates = useMemo(
    () =>
      categories.filter((category) => (templatesByCategory[category.id]?.length ?? 0) > 0),
    [categories, templatesByCategory],
  );
  const filteredCategories = useMemo(
    () => filterCreateListingCategories(categoriesWithTemplates, deferredCategorySearch, locale),
    [categoriesWithTemplates, deferredCategorySearch, locale],
  );
  const selectedCategory = useMemo(
    () => categoriesWithTemplates.find((category) => category.id === selectedCategoryId) ?? null,
    [categoriesWithTemplates, selectedCategoryId],
  );
  const selectedCategoryLabel = selectedCategory
    ? localizeCategoryName(selectedCategory, locale)
    : null;
  const selectedTemplates = useMemo(
    () => (selectedCategoryId ? templatesByCategory[selectedCategoryId] ?? [] : []),
    [selectedCategoryId, templatesByCategory],
  );
  const primaryTemplateKeys = useMemo(
    () => getCreateListingPrimaryTemplateKeys(selectedTemplates),
    [selectedTemplates],
  );
  const primaryTemplateKeySet = useMemo(
    () => new Set(primaryTemplateKeys),
    [primaryTemplateKeys],
  );
  const secondaryTemplateKeys = useMemo(
    () =>
      selectedTemplates
        .map((template) => template.key)
        .filter((key) => !primaryTemplateKeySet.has(key)),
    [primaryTemplateKeySet, selectedTemplates],
  );
  const normalizedServerErrorField = useMemo(
    () => resolveCreateNormalizedErrorField(serverErrorMessage, serverErrorFieldState),
    [serverErrorMessage, serverErrorFieldState],
  );

  const [, formAction, isActionBusy] = useActionState<CreateListingResult | null, FormData>(
    async (_prevState, formData) => {
      try {
        const result = (await action(formData)) as CreateListingResult;

        if (result && typeof result === "object" && "ok" in result && result.ok) {
          setServerErrorMessage(null);
          setServerErrorFieldState(null);
          setNeedsEditListingId(null);
          setSuccessMessage(result.message || text.publishedSuccess);

          if (result.status === "ACTIVE") {
            setIsClosingAfterSuccess(true);
            if (successTimerRef.current) {
              window.clearTimeout(successTimerRef.current);
            }
            successTimerRef.current = window.setTimeout(() => {
              setIsClosingAfterSuccess(false);
              onPublished?.();
            }, 1200);
          }

          return result;
        }

        setSuccessMessage(null);
        setIsClosingAfterSuccess(false);
        setServerErrorMessage(result?.error ?? text.submitFailed);
        setServerErrorFieldState(result?.field ?? null);
        setNeedsEditListingId(result?.needsEdit ? result.listingId ?? null : null);
        const errorStep = resolveCreateJumpStep(result?.field, result?.error);
        if (errorStep) setCurrentStep(errorStep);
        return result;
      } catch {
        const fallback = {
          ok: false,
          error: text.submitFailed,
          field: "general",
        } as CreateListingResult;
        setSuccessMessage(null);
        setIsClosingAfterSuccess(false);
        setServerErrorMessage(text.submitFailed);
        setServerErrorFieldState("general");
        return fallback;
      }
    },
    null,
  );

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviewUrls]);

  useEffect(() => {
    setShowMoreDetails(false);
  }, [selectedCategoryId]);

  const validatePhotos = (files: FileList | null) =>
    validateCreateListingPhotos(files, {
      photosCountError: text.photosCountError,
      photosSingleSizeError: text.photosSingleSizeError,
      photosTotalSizeError: text.photosTotalSizeError,
    });

  const validateStep = (step: CreateListingWizardStep) => {
    if (step === 1) {
      const photosError = validatePhotos(photosInputRef.current?.files ?? null);
      setPhotoValidationError(photosError);
      setStepError(photosError);
      return !photosError;
    }

    if (step === 2) {
      if (!title.trim()) {
        setStepError(text.titleRequired);
        return false;
      }

      if (!selectedCategoryId) {
        setStepError(text.categoryRequired);
        return false;
      }

      if (!cityId) {
        setStepError(text.cityRequired);
        return false;
      }

      return true;
    }

    if (!price.trim() || Number.parseFloat(price) <= 0) {
      setStepError(text.priceRequired);
      return false;
    }

    if (!phone.trim()) {
      setStepError(text.phoneRequired);
      return false;
    }

    return true;
  };

  async function submitForm() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.set("intent", "publish");
    await formAction(formData);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isActionBusy || !validateStep(currentStep)) {
      return;
    }

    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as CreateListingWizardStep);
      setStepError(null);
      return;
    }

    if (requiresDummyPayment) {
      setShowPaymentPanel(true);
      return;
    }

    await submitForm();
  }

  const primaryLabel = isActionBusy
    ? text.publishing
    : currentStep < 3
      ? text.continue
      : resolvedPublishLabel;

  const conditionLabels = {
    [ListingCondition.NEW]: text.conditionNew,
    [ListingCondition.USED]: text.conditionUsed,
    [ListingCondition.REFURBISHED]: text.conditionRefurbished,
  };

  const paymentAmount = resolveCreatePaymentAmount(plan);
  const paymentLabel = plan === "subscription" ? text.subscription : text.payPerListing;

  const titleError =
    stepError === text.titleRequired
      ? stepError
      : normalizedServerErrorField === "title"
        ? serverErrorMessage
        : null;
  const categoryError =
    stepError === text.categoryRequired
      ? stepError
      : normalizedServerErrorField === "categoryId"
        ? serverErrorMessage
        : null;
  const cityError =
    stepError === text.cityRequired
      ? stepError
      : normalizedServerErrorField === "cityId"
        ? serverErrorMessage
        : null;
  const priceError =
    stepError === text.priceRequired
      ? stepError
      : normalizedServerErrorField === "price"
        ? serverErrorMessage
        : null;
  const phoneError =
    stepError === text.phoneRequired
      ? stepError
      : normalizedServerErrorField === "phone"
        ? serverErrorMessage
        : null;
  const generalServerError =
    serverErrorMessage &&
    !["title", "categoryId", "cityId", "price", "phone"].includes(
      normalizedServerErrorField ?? "",
    )
      ? serverErrorMessage
      : null;

  const stepCopy = useMemo(() => {
    if (locale === "mk") {
      return {
        photosHeading: "Додај фотографии",
        photosHelper: "Добрите фотографии помагаат побрзо да се продаде.",
        detailsHeading: "Детали за предметот",
        identityFieldsLabel: "Клучни детали",
        identityFieldsHint:
          "Додај само што најмногу помага купувачите да го пронајдат огласот.",
        identityFieldsEmpty: "Нема клучни детали за оваа категорија.",
        priceHeading: "Постави цена",
        priceHelper: "Подоцна можеш да ја промениш.",
        addMoreDetails:
          secondaryTemplateKeys.length > 0
            ? `Додај уште ${secondaryTemplateKeys.length} детали`
            : "Додај повеќе детали",
        hideMoreDetails: "Сокриј дополнителни детали",
        moreDetailsHint:
          secondaryTemplateKeys.length > 0
            ? "Овие детали се опционални. Додај ги само ако му даваат повеќе контекст на огласот."
            : "Нема дополнителни полиња за избраната категорија.",
        moreDetailsEmpty: "Нема дополнителни полиња за оваа категорија.",
      };
    }

    return {
      photosHeading: "Add photos",
      photosHelper: "Good photos help your item sell faster.",
      detailsHeading: "Item details",
      identityFieldsLabel: "Key details",
      identityFieldsHint: "Add only the details that help buyers recognize what you are selling.",
      identityFieldsEmpty: "No key details are available for this category.",
      priceHeading: "Set your price",
      priceHelper: "You can always change this later.",
      addMoreDetails:
        secondaryTemplateKeys.length > 0
          ? `Add ${secondaryTemplateKeys.length} more details`
          : "Add more details",
      hideMoreDetails: "Hide extra details",
      moreDetailsHint:
        secondaryTemplateKeys.length > 0
          ? "These extra category details are optional. Add them only when they improve search and buyer confidence."
          : "No extra details are available for this category.",
      moreDetailsEmpty: "No additional fields for this category.",
    };
  }, [locale, secondaryTemplateKeys.length]);

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="flex h-full min-w-0 flex-col">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="intent" value="publish" />
        <input type="hidden" name="plan" value={plan} />
        <input type="hidden" name="condition" value={condition} />
        <input type="hidden" name="categoryId" value={selectedCategoryId} />
        {selectedTemplates.map((template) => (
          <input
            key={template.key}
            type="hidden"
            name={`${DYNAMIC_FIELD_PREFIX}${template.key}`}
            value={dynamicFieldValues[template.key] ?? ""}
          />
        ))}
        {paymentProvider !== "none" ? (
          <input type="hidden" name="paymentProvider" value={paymentProvider} />
        ) : null}
        <input type="hidden" name="dummyCardNumber" value={paymentDraft.cardNumber} />
        <input type="hidden" name="dummyCardExp" value={paymentDraft.expiry} />
        <input type="hidden" name="dummyCardCvc" value={paymentDraft.cvc} />
        <input type="hidden" name="dummyCardName" value={paymentDraft.cardholder} />

        <CreateListingHeader
          currentStep={stepMeta.step}
          totalSteps={3}
          stepTitle={stepMeta.title}
          backLabel={text.back}
          closeLabel={modalText.close}
          canGoBack={currentStep > 1}
          onBack={() => {
            setCurrentStep((currentStep - 1) as CreateListingWizardStep);
            setStepError(null);
          }}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6 sm:pb-36 sm:pt-7">
          <div className="space-y-4.5 sm:space-y-5">
            <CreateListingFeedback
              successMessage={successMessage}
              isClosingAfterSuccess={isClosingAfterSuccess}
              closingSoonLabel={text.closingSoon}
              stepError={stepError}
              generalServerError={generalServerError}
              needsEditListingId={needsEditListingId}
              openEditLabel={text.openEdit}
              defaultsSaved={defaultsSaved}
              defaultsSavedLabel={text.defaultsSaved}
            />

            {currentStep === 1 ? (
              <CreateListingStepPhotos
                heading={stepCopy.photosHeading}
                helperText={stepCopy.photosHelper}
                selectedPhotosLabel={modalText.selectedPhotos}
                addPhotosLabel={modalText.choosePhotos}
                photoHint=""
                photoPreviewUrls={photoPreviewUrls}
                photoValidationError={photoValidationError}
                photosInputRef={photosInputRef}
                isActionBusy={isActionBusy}
                onPhotoChange={(files) => {
                  const nextError = validatePhotos(files);
                  setPhotoValidationError(nextError);
                  setStepError(nextError);
                  setPhotoPreviewUrls((previous) => {
                    previous.forEach((url) => URL.revokeObjectURL(url));
                    return files
                      ? Array.from(files).slice(0, 10).map((file) => URL.createObjectURL(file))
                      : [];
                  });
                }}
              />
            ) : null}

            {currentStep === 2 ? (
              <CreateListingStepDetails
                locale={locale}
                heading={stepCopy.detailsHeading}
                titleLabel={text.title}
                titlePlaceholder={text.titlePlaceholder}
                titleValue={title}
                titleError={titleError}
                categoryLabel={text.category}
                categorySearchPlaceholder={text.categorySearchPlaceholder}
                categorySearch={categorySearch}
                selectedCategoryId={selectedCategoryId}
                categoryOptions={filteredCategories}
                selectedCategoryLabel={selectedCategoryLabel}
                noCategoryMatchLabel={text.noCategoryMatch}
                categoryError={categoryError}
                conditionLabel={text.condition}
                condition={condition}
                conditionLabels={conditionLabels}
                cityLabel={text.city}
                cityId={cityId}
                cities={cities}
                noCityAvailableLabel={text.noCityAvailable}
                cityError={cityError}
                identityFieldsLabel={stepCopy.identityFieldsLabel}
                identityFieldsHint={stepCopy.identityFieldsHint}
                identityFieldsEmptyLabel={stepCopy.identityFieldsEmpty}
                primaryTemplateKeys={primaryTemplateKeys}
                templatesByCategory={templatesByCategory}
                dynamicValues={dynamicFieldValues}
                descriptionLabel={text.description}
                descriptionPlaceholder={text.descriptionPlaceholder}
                descriptionValue={description}
                isActionBusy={isActionBusy}
                onTitleChange={(value) => {
                  setTitle(value);
                  setStepError(null);
                  setServerErrorMessage(null);
                }}
                onCategorySearchChange={setCategorySearch}
                onCategoryChange={(value, label) => {
                  setSelectedCategoryId(value);
                  setCategorySearch(label);
                  setStepError(null);
                  setServerErrorMessage(null);
                }}
                onConditionChange={setCondition}
                onCityChange={(value) => {
                  setCityId(value);
                  setStepError(null);
                  setServerErrorMessage(null);
                }}
                onDynamicValuesChange={setDynamicFieldValues}
                onDescriptionChange={setDescription}
              />
            ) : null}

            {currentStep === 3 ? (
              <CreateListingStepPrice
                locale={locale}
                heading={stepCopy.priceHeading}
                helperText={stepCopy.priceHelper}
                priceLabel={text.price}
                pricePlaceholder={text.pricePlaceholder}
                priceValue={price}
                priceError={priceError}
                currency={currency}
                phoneLabel={text.phone}
                phonePlaceholder={text.phonePlaceholder}
                phoneCountry={phoneCountry}
                phoneValue={phone}
                phoneCountryOptions={phoneCountryOptions}
                phoneError={phoneError}
                showPlanSelector={showPlanSelector}
                planLabel={text.sellerPackage}
                payPerListingLabel={text.payPerListing}
                subscriptionLabel={text.subscription}
                daysActiveLabel={text.daysActive30}
                monthlyUnlimitedLabel={text.monthlyUnlimited}
                packageHint={modalText.packageHint}
                plan={plan}
                addMoreDetailsLabel={stepCopy.addMoreDetails}
                hideMoreDetailsLabel={stepCopy.hideMoreDetails}
                moreDetailsHint={stepCopy.moreDetailsHint}
                moreDetailsEmptyLabel={stepCopy.moreDetailsEmpty}
                showMoreDetails={showMoreDetails}
                selectedCategoryId={selectedCategoryId}
                templatesByCategory={templatesByCategory}
                dynamicValues={dynamicFieldValues}
                secondaryTemplateKeys={secondaryTemplateKeys}
                isActionBusy={isActionBusy}
                onPriceChange={(value) => {
                  setPrice(value);
                  setStepError(null);
                  setServerErrorMessage(null);
                }}
                onCurrencyChange={setCurrency}
                onPhoneCountryChange={setPhoneCountry}
                onPhoneChange={(value) => {
                  setPhone(value);
                  setStepError(null);
                  setServerErrorMessage(null);
                }}
                onPlanChange={setPlan}
                onToggleMoreDetails={() => setShowMoreDetails((value) => !value)}
                onDynamicValuesChange={setDynamicFieldValues}
              />
            ) : null}
          </div>
        </div>

        <StickyPublishBar
          backLabel={text.back}
          primaryLabel={primaryLabel}
          canGoBack={currentStep > 1}
          isBusy={isActionBusy || isClosingAfterSuccess}
          onBack={() => {
            setCurrentStep((currentStep - 1) as CreateListingWizardStep);
            setStepError(null);
          }}
        />
      </form>

      {requiresDummyPayment ? (
        <CreateListingPaymentModal
          show={showPaymentPanel}
          isActionBusy={isActionBusy}
          paymentAmount={paymentAmount}
          paymentLabel={paymentLabel}
          closePaymentPopupLabel={text.closePaymentPopup}
          secureCheckoutLabel={text.secureCheckout}
          closeLabel={text.close}
          cardNumberLabel={text.cardNumber}
          expiryLabel={text.expiry}
          cvcLabel={text.cvc}
          cardholderLabel={text.cardholder}
          cardholderPlaceholder={text.cardholderPlaceholder}
          successFailCardsLabel={text.successFailCards}
          cancelLabel={text.cancel}
          publishLabel={resolvedPublishLabel}
          publishingLabel={text.publishing}
          cardNumberValue={paymentDraft.cardNumber}
          expiryValue={paymentDraft.expiry}
          cvcValue={paymentDraft.cvc}
          cardholderValue={paymentDraft.cardholder}
          onCardNumberChange={(value) =>
            setPaymentDraft((current) => ({ ...current, cardNumber: value }))
          }
          onExpiryChange={(value) =>
            setPaymentDraft((current) => ({ ...current, expiry: value }))
          }
          onCvcChange={(value) =>
            setPaymentDraft((current) => ({ ...current, cvc: value }))
          }
          onCardholderChange={(value) =>
            setPaymentDraft((current) => ({ ...current, cardholder: value }))
          }
          onClose={() => setShowPaymentPanel(false)}
          onConfirm={submitForm}
        />
      ) : null}
    </>
  );
}
