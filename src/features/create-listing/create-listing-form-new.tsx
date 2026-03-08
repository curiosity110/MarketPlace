"use client";

import { useActionState, useRef, useState } from "react";
import { Currency, ListingCondition } from "@prisma/client";
import { CreateListingFeedback } from "@/components/create-listing/feedback";
import { getCreateListingWizardText } from "@/components/create-listing/messages";
import { CreateListingPaymentModal } from "@/components/create-listing/payment-modal";
import { validateCreateListingPhotos } from "@/components/create-listing/state/wizard-form.validation";
import { CreateListingHeader } from "@/features/create-listing/create-listing-header";
import { CreateListingStepDetails } from "@/features/create-listing/create-listing-step-details";
import { CreateListingStepPhotos } from "@/features/create-listing/create-listing-step-photos";
import { CreateListingStepPrice } from "@/features/create-listing/create-listing-step-price";
import { StickyPublishBar } from "@/features/create-listing/sticky-publish-bar";
import type {
  CreateListingCategoryOption,
  CreateListingCityOption,
  CreateListingInitialValues,
  CreateListingPlanOption,
  CreateListingResult,
  CreateListingTemplateMap,
  CreateListingWizardStep,
} from "@/features/create-listing/types";
import {
  getCreateListingInitialStep,
  getCreateListingModalText,
  getCreateListingPhoneCountryOptions,
  getCreateListingStepMeta,
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
  void templatesByCategory;
  void allowDraft;

  const text = getCreateListingWizardText(locale);
  const modalText = getCreateListingModalText(locale);
  const resolvedPublishLabel = publishLabel ?? text.publish;
  const requiresDummyPayment = paymentProvider === "stripe-dummy";
  const phoneCountryOptions = getCreateListingPhoneCountryOptions();

  const [currentStep, setCurrentStep] = useState<CreateListingWizardStep>(() =>
    getCreateListingInitialStep({ serverError, serverErrorField }),
  );
  const [stepError, setStepError] = useState<string | null>(null);
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(null);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);

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

  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const stepMeta = getCreateListingStepMeta(currentStep, {
    photos: text.photos,
    basics: text.basics,
    price: text.price,
  });

  const [state, formAction, isActionBusy] = useActionState<
    CreateListingResult | null,
    FormData
  >(async (_prevState, formData) => {
    const result = await action(formData);

    if (result && typeof result === "object" && "ok" in result && result.ok) {
      onPublished?.();
    }

    return result as CreateListingResult;
  }, null);

  const validatePhotos = (files: FileList | null) =>
    validateCreateListingPhotos(files, {
      photosCountError: text.photosCountError,
      photosSingleSizeError: text.photosSingleSizeError,
      photosTotalSizeError: text.photosTotalSizeError,
    });

  const validateStep = (step: CreateListingWizardStep) => {
    if (step === 1) {
      const photosError = validatePhotos(photosInputRef.current?.files ?? null);

      if (photosError) {
        setPhotoValidationError(photosError);
        setStepError(photosError);
        return false;
      }

      return true;
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

  const submitForm = async () => {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("plan", plan);
    formData.set("condition", condition);

    if (paymentProvider !== "none") {
      formData.set("paymentProvider", paymentProvider);
    }

    formData.set("title", title);
    formData.set("description", description);
    formData.set("categoryId", selectedCategoryId);
    formData.set("cityId", cityId);
    formData.set("price", price);
    formData.set("currency", currency);
    formData.set("phoneCountry", phoneCountry);
    formData.set("phone", phone);

    if (photosInputRef.current?.files) {
      Array.from(photosInputRef.current.files).forEach((file) => {
        formData.append("photos", file);
      });
    }

    await formAction(formData);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
  };

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

  return (
    <>
      <form onSubmit={handleSubmit} className="flex h-full min-w-0 flex-col">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="plan" value={plan} />
        <input type="hidden" name="condition" value={condition} />
        {paymentProvider !== "none" ? (
          <input type="hidden" name="paymentProvider" value={paymentProvider} />
        ) : null}

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

        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-5 sm:px-6">
          <div className="space-y-5">
            <CreateListingFeedback
              successMessage={state && "ok" in state && state.ok ? resolvedPublishLabel : null}
              isClosingAfterSuccess={false}
              closingSoonLabel={text.closingSoon}
              stepError={stepError}
              generalServerError={state && "error" in state ? state.error : serverError || null}
              needsEditListingId={null}
              openEditLabel={text.openEdit}
              defaultsSaved={defaultsSaved}
              defaultsSavedLabel={text.defaultsSaved}
            />

            {currentStep === 1 ? (
              <CreateListingStepPhotos
                heading={text.photos}
                helperText={modalText.titleGroupHint}
                selectedPhotosLabel={modalText.selectedPhotos}
                addPhotosLabel={modalText.choosePhotos}
                photoHint={text.photoHint}
                photoPreviewUrls={photoPreviewUrls}
                photoValidationError={photoValidationError}
                photosInputRef={photosInputRef}
                isActionBusy={isActionBusy}
                onPhotoChange={(files) => {
                  const nextError = validatePhotos(files);
                  setPhotoValidationError(nextError);
                  setStepError(nextError);
                  setPhotoPreviewUrls(
                    files ? Array.from(files).map((file) => URL.createObjectURL(file)) : [],
                  );
                }}
              />
            ) : null}

            {currentStep === 2 ? (
              <CreateListingStepDetails
                locale={locale}
                heading={text.basics}
                titleLabel={text.title}
                titlePlaceholder={text.titlePlaceholder}
                titleValue={title}
                categoryLabel={text.category}
                categorySearchPlaceholder={text.categorySearchPlaceholder}
                categorySearch={categorySearch}
                selectedCategoryId={selectedCategoryId}
                categoryOptions={categories}
                noCategoryMatchLabel={text.noCategoryMatch}
                categoryError={stepError === text.categoryRequired ? text.categoryRequired : null}
                conditionLabel={text.condition}
                condition={condition}
                conditionLabels={conditionLabels}
                cityLabel={text.city}
                cityId={cityId}
                cities={cities}
                noCityAvailableLabel={text.noCityAvailable}
                cityError={stepError === text.cityRequired ? text.cityRequired : null}
                descriptionLabel={text.description}
                descriptionPlaceholder={text.descriptionPlaceholder}
                descriptionValue={description}
                isActionBusy={isActionBusy}
                onTitleChange={(value) => {
                  setTitle(value);
                  setStepError(null);
                }}
                onCategorySearchChange={setCategorySearch}
                onCategoryChange={(value) => {
                  setSelectedCategoryId(value);
                  setStepError(null);
                }}
                onConditionChange={setCondition}
                onCityChange={(value) => {
                  setCityId(value);
                  setStepError(null);
                }}
                onDescriptionChange={setDescription}
              />
            ) : null}

            {currentStep === 3 ? (
              <CreateListingStepPrice
                heading={text.price}
                helperText={modalText.contactHint}
                priceLabel={text.price}
                pricePlaceholder={text.pricePlaceholder}
                priceValue={price}
                currency={currency}
                phoneLabel={text.phone}
                phonePlaceholder={text.phonePlaceholder}
                phoneCountry={phoneCountry}
                phoneValue={phone}
                phoneCountryOptions={phoneCountryOptions}
                phoneError={stepError === text.phoneRequired ? text.phoneRequired : null}
                showPlanSelector={showPlanSelector}
                planLabel={text.sellerPackage}
                payPerListingLabel={text.payPerListing}
                subscriptionLabel={text.subscription}
                daysActiveLabel={text.daysActive30}
                monthlyUnlimitedLabel={text.monthlyUnlimited}
                packageHint={modalText.packageHint}
                plan={plan}
                isActionBusy={isActionBusy}
                onPriceChange={(value) => {
                  setPrice(value);
                  setStepError(null);
                }}
                onCurrencyChange={setCurrency}
                onPhoneCountryChange={setPhoneCountry}
                onPhoneChange={(value) => {
                  setPhone(value);
                  setStepError(null);
                }}
                onPlanChange={setPlan}
              />
            ) : null}
          </div>
        </div>

        <StickyPublishBar
          backLabel={text.back}
          primaryLabel={primaryLabel}
          canGoBack={currentStep > 1}
          isBusy={isActionBusy}
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
          onClose={() => setShowPaymentPanel(false)}
          onConfirm={submitForm}
        />
      ) : null}
    </>
  );
}
