"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Currency, ListingCondition } from "@prisma/client";
import { CreateListingActionsBar } from "@/components/create-listing/actions-bar";
import { CreateListingFeedback } from "@/components/create-listing/feedback";
import { CreateListingFormLayout } from "@/components/create-listing/form-layout";
import { getCreateListingWizardText } from "@/components/create-listing/messages";
import { CreateListingPaymentModal } from "@/components/create-listing/payment-modal";
import { CreateListingQuickFillPanel } from "@/components/create-listing/quick-fill/quick-fill-panel";
import {
  normalizeCreateQuickSearchText,
  resolveCreateQuickConfidenceLabel,
  resolveCreateQuickSuggestionLabel,
  scoreCreateQuickSearchField,
} from "@/components/create-listing/quick-fill/quick-fill.utils";
import { CreateListingCategorySection } from "@/components/create-listing/sections/category-condition-section";
import { CreateListingDescriptionSection } from "@/components/create-listing/sections/description-section";
import { CreateListingDynamicFieldsSection } from "@/components/create-listing/sections/dynamic-fields-section";
import { CreateListingLocationContactSection } from "@/components/create-listing/sections/location-contact-section";
import { CreateListingPhotoUploadSection } from "@/components/create-listing/sections/photo-upload-section";
import { CreateListingPlanSection } from "@/components/create-listing/sections/plan-section";
import { CreateListingPricingSection } from "@/components/create-listing/sections/pricing-section";
import { CreateListingTitleSection } from "@/components/create-listing/sections/title-section";
import {
  appendUniqueTokenToTitle,
  inferCreateErrorField,
  inferCreateErrorStep,
} from "@/components/create-listing/state/wizard-form.helpers";
import { resolveCreateSuccessMessage } from "@/components/create-listing/state/wizard-form.mappers";
import type {
  CreateFieldErrorKey,
  CreateListingActionResult,
  CreateListingWizardProps as Props,
  CreateSubmitIntent,
} from "@/components/create-listing/state/wizard-form.types";
import { validateCreateListingPhotos } from "@/components/create-listing/state/wizard-form.validation";
import type {
  CreateListingPlan as ListingPlan,
} from "@/components/create-listing/types";
import { localizeCategoryName } from "@/lib/category-label";
import { normalizePhoneInput } from "@/lib/phone";
import {
  quickFillFromLine,
  type QuickFillResult,
  type QuickFillSuggestion,
  type QuickFillCategoryCandidate,
} from "@/lib/quick-fill";

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
  serverError = null,
  serverErrorField = null,
  defaultsSaved = false,
  onPublished,
}: Props) {
  // Form orchestrator: owns client step state + action wiring; section components stay presentational.
  const text = getCreateListingWizardText(locale);

  const resolvedPublishLabel = publishLabel ?? text.publish;
  const requiresDummyPayment = paymentProvider === "stripe-dummy";
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const [currentStep, setCurrentStep] = useState(() => {
    if (serverErrorField === "title" || serverErrorField === "categoryId" || serverErrorField === "price") {
      return 2;
    }
    if (serverErrorField === "cityId" || serverErrorField === "phone") {
      return 3;
    }
    if (serverError) {
      if (/(title|наслов|category|категори|price|цена)/i.test(serverError)) return 2;
      if (/(city|град|phone|телефон)/i.test(serverError)) return 3;
    }
    return 1;
  });
  const [stepError, setStepError] = useState<string | null>(null);
  const [photoValidationError, setPhotoValidationError] = useState<string | null>(null);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [selectedPhotosCount, setSelectedPhotosCount] = useState(0);
  const [quickFillStatus, setQuickFillStatus] = useState<"idle" | "analyzing" | "ready">(
    "idle",
  );
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [plan, setPlan] = useState<ListingPlan>(
    initial?.plan ?? "pay-per-listing",
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initial?.categoryId ?? "",
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
  const [quickFillLine, setQuickFillLine] = useState(initial?.title ?? "");
  const [quickFillResult, setQuickFillResult] = useState<QuickFillResult | null>(
    null,
  );
  const [quickFillMessage, setQuickFillMessage] = useState<string | null>(null);
  const [suggestedDynamicValues, setSuggestedDynamicValues] = useState<
    Record<string, string>
  >({});
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(serverError);
  const [serverErrorFieldState, setServerErrorFieldState] = useState<string | null>(
    serverErrorField,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isClosingAfterSuccess, setIsClosingAfterSuccess] = useState(false);
  const [needsEditListingId, setNeedsEditListingId] = useState<string | null>(null);
  const submitIntentRef = useRef<CreateSubmitIntent>("unknown");
  const successTimerRef = useRef<number | null>(null);

  function jumpToErrorStep(field?: CreateFieldErrorKey, message?: string) {
    const step = inferCreateErrorStep(field, message);
    if (step) setCurrentStep(step);
  }

  const [, formAction, isPending] = useActionState<CreateListingActionResult | null, FormData>(
    async (_previousState, formData) => {
      let value: unknown;
      try {
        value = await Promise.resolve(action(formData));
      } catch {
        const fallbackError: CreateListingActionResult = {
          ok: false,
          error: text.submitFailed,
          field: "general",
        };
        setSuccessMessage(null);
        setIsClosingAfterSuccess(false);
        setServerErrorMessage(fallbackError.error);
        setServerErrorFieldState(fallbackError.field ?? null);
        setNeedsEditListingId(null);
        return fallbackError;
      }

      if (!value || typeof value !== "object") {
        const fallbackError: CreateListingActionResult = {
          ok: false,
          error: text.submitFailed,
          field: "general",
        };
        setSuccessMessage(null);
        setIsClosingAfterSuccess(false);
        setServerErrorMessage(fallbackError.error);
        setServerErrorFieldState(fallbackError.field ?? null);
        setNeedsEditListingId(null);
        return fallbackError;
      }

      const actionResult = value as CreateListingActionResult;
      if (actionResult.ok) {
        setServerErrorMessage(null);
        setServerErrorFieldState(null);
        setNeedsEditListingId(null);

        if (submitIntentRef.current === "publish" && actionResult.status === "ACTIVE") {
          setSuccessMessage(actionResult.message || text.publishedSuccess);
          setIsClosingAfterSuccess(true);
          if (successTimerRef.current) {
            window.clearTimeout(successTimerRef.current);
          }
          successTimerRef.current = window.setTimeout(() => {
            setIsClosingAfterSuccess(false);
            onPublished?.();
          }, 1200);
          return actionResult;
        }

        setIsClosingAfterSuccess(false);
        setSuccessMessage(
          resolveCreateSuccessMessage(actionResult, submitIntentRef.current, {
            publishedSuccess: text.publishedSuccess,
            draftSavedInline: text.draftSavedInline,
            defaultsSaved: text.defaultsSaved,
          }),
        );
        return actionResult;
      }

      setSuccessMessage(null);
      setIsClosingAfterSuccess(false);
      setServerErrorMessage(actionResult.error);
      setServerErrorFieldState(actionResult.field ?? null);
      setNeedsEditListingId(actionResult.needsEdit ? actionResult.listingId ?? null : null);
      jumpToErrorStep(actionResult.field, actionResult.error);
      return actionResult;
    },
    null,
  );
  const isActionBusy = isPending || isClosingAfterSuccess;

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const paymentAmount = plan === "subscription" ? 30 : 4;
  const paymentLabel = plan === "subscription" ? text.subscription : text.payPerListing;
  const categoriesWithTemplates = useMemo(
    () =>
      categories.filter(
        (category) => (templatesByCategory[category.id]?.length ?? 0) > 0,
      ),
    [categories, templatesByCategory],
  );
  const resolvedSelectedCategoryId = useMemo(() => {
    if (!selectedCategoryId) return "";
    return categoriesWithTemplates.some(
      (category) => category.id === selectedCategoryId,
    )
      ? selectedCategoryId
      : "";
  }, [categoriesWithTemplates, selectedCategoryId]);

  const conditionLabelByValue: Record<ListingCondition, string> = {
    NEW: text.conditionNew,
    USED: text.conditionUsed,
    REFURBISHED: text.conditionRefurbished,
  };
  const categorySearchEntries = useMemo(
    () =>
      categoriesWithTemplates.map((category) => {
        const localizedName = localizeCategoryName(category, locale);
        return {
          category,
          localizedName,
          normalizedLocalizedName: normalizeCreateQuickSearchText(localizedName),
          normalizedRawName: normalizeCreateQuickSearchText(category.name),
          normalizedSlug: normalizeCreateQuickSearchText(category.slug),
        };
      }),
    [categoriesWithTemplates, locale],
  );
  const filteredCategories = useMemo(() => {
    const normalizedQuery = normalizeCreateQuickSearchText(categorySearch);
    if (!normalizedQuery) return categoriesWithTemplates;

    const queryTokens = normalizedQuery.split(" ").filter(Boolean);
    return categorySearchEntries
      .map((entry) => {
        const localizedScore =
          scoreCreateQuickSearchField(
            entry.normalizedLocalizedName,
            normalizedQuery,
            queryTokens,
          ) * 3;
        const rawNameScore =
          scoreCreateQuickSearchField(
            entry.normalizedRawName,
            normalizedQuery,
            queryTokens,
          ) * 2;
        const slugScore = scoreCreateQuickSearchField(
          entry.normalizedSlug,
          normalizedQuery,
          queryTokens,
        );
        const score = Math.max(localizedScore, rawNameScore, slugScore);
        return { ...entry, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.localizedName.localeCompare(b.localizedName, locale);
      })
      .map((entry) => entry.category);
  }, [categoriesWithTemplates, categorySearch, categorySearchEntries, locale]);
  const categoryOptions = useMemo(() => {
    if (!resolvedSelectedCategoryId) return filteredCategories;
    if (filteredCategories.some((category) => category.id === resolvedSelectedCategoryId)) {
      return filteredCategories;
    }

    const selectedCategoryOption = categoriesWithTemplates.find(
      (category) => category.id === resolvedSelectedCategoryId,
    );
    if (!selectedCategoryOption) return filteredCategories;
    return [selectedCategoryOption, ...filteredCategories];
  }, [categoriesWithTemplates, filteredCategories, resolvedSelectedCategoryId]);
  const selectedCategoryTemplates = useMemo(
    () => templatesByCategory[resolvedSelectedCategoryId] ?? [],
    [resolvedSelectedCategoryId, templatesByCategory],
  );
  const dynamicFieldKeysBySuggestion = useMemo(() => {
    const findTemplateKey = (patterns: string[]) =>
      selectedCategoryTemplates.find((template) => {
        const normalized = normalizeCreateQuickSearchText(
          `${template.key} ${template.label}`,
        );
        return patterns.some((pattern) => normalized.includes(pattern));
      })?.key;

    return {
      brand: findTemplateKey(["brand", "make", "марка"]),
      model: findTemplateKey(["model", "модел"]),
      year: findTemplateKey(["year", "година"]),
      fuel: findTemplateKey(["fuel", "гориво"]),
      transmission: findTemplateKey([
        "transmission",
        "gearbox",
        "менувач",
        "трансмисија",
      ]),
      kilometers: findTemplateKey(["kilometer", "kilomet", "mileage", "км", "килом"]),
    };
  }, [selectedCategoryTemplates]);
  const quickSuggestions = quickFillResult?.suggestions ?? [];
  const quickCategoryCandidates = quickFillResult?.categoryCandidates ?? [];
  const hasQuickFillSuggestions =
    quickSuggestions.length > 0 || quickCategoryCandidates.length > 0;
  const normalizedServerErrorField = useMemo<CreateFieldErrorKey>(
    () => inferCreateErrorField(serverErrorMessage, serverErrorFieldState),
    [serverErrorFieldState, serverErrorMessage],
  );

  const titleServerError =
    serverErrorMessage && normalizedServerErrorField === "title"
      ? serverErrorMessage
      : null;
  const categoryServerError =
    serverErrorMessage && normalizedServerErrorField === "categoryId"
      ? serverErrorMessage
      : null;
  const categoryInlineError =
    categoryServerError ||
    (stepError === text.categoryRequired ? text.categoryRequired : null);
  const cityServerError =
    serverErrorMessage && normalizedServerErrorField === "cityId"
      ? serverErrorMessage
      : null;
  const priceServerError =
    serverErrorMessage && normalizedServerErrorField === "price"
      ? serverErrorMessage
      : null;
  const phoneServerError =
    serverErrorMessage && normalizedServerErrorField === "phone"
      ? serverErrorMessage
      : null;
  const generalServerError =
    serverErrorMessage && normalizedServerErrorField === "general"
      ? serverErrorMessage
      : null;

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
    return validateCreateListingPhotos(files, {
      photosCountError: text.photosCountError,
      photosSingleSizeError: text.photosSingleSizeError,
      photosTotalSizeError: text.photosTotalSizeError,
    });
  }

  function refreshPhotoPreview(files: FileList | null) {
    setSelectedPhotosCount(files?.length ?? 0);
    setPhotoPreviewUrls((previous) => {
      previous.forEach((url) => URL.revokeObjectURL(url));
      if (!files || files.length === 0) return [];
      return Array.from(files).slice(0, 8).map((file) => URL.createObjectURL(file));
    });
  }

  function appendSuggestionToTitle(value: string) {
    setTitle((previous) => {
      return appendUniqueTokenToTitle(previous, value);
    });
  }

  function resolveQuickSuggestionLabel(suggestion: QuickFillSuggestion) {
    return resolveCreateQuickSuggestionLabel(suggestion, {
      brand: text.quickFieldBrand,
      model: text.quickFieldModel,
      year: text.quickFieldYear,
      condition: text.quickFieldCondition,
      city: text.quickFieldCity,
      price: text.quickFieldPrice,
      fuel: text.quickFieldFuel,
      transmission: text.quickFieldTransmission,
      kilometers: text.quickFieldKilometers,
      description: text.quickFieldDescription,
    });
  }

  function resolveConfidenceLabel(confidence: "high" | "medium" | "low") {
    return resolveCreateQuickConfidenceLabel(confidence, {
      high: text.confidenceHigh,
      medium: text.confidenceMedium,
      low: text.confidenceLow,
    });
  }

  function resolveCategoryForCandidate(candidateId: string) {
    const hasTemplates = (categoryId: string | undefined) =>
      Boolean(categoryId && (templatesByCategory[categoryId]?.length ?? 0) > 0);

    if (hasTemplates(candidateId)) return candidateId;
    const selected = categories.find((category) => category.id === candidateId);
    if (!selected) return "";
    if (hasTemplates(selected.parentId || undefined)) return selected.parentId || "";
    const firstChildWithTemplates = categories.find(
      (category) => category.parentId === selected.id && hasTemplates(category.id),
    );
    return firstChildWithTemplates?.id || "";
  }

  function applyQuickCategoryCandidate(candidate: QuickFillCategoryCandidate) {
    const resolvedCategoryId = resolveCategoryForCandidate(candidate.categoryId);
    if (!resolvedCategoryId) return;
    setSelectedCategoryId(resolvedCategoryId);
    setServerErrorMessage(null);
  }

  function applyQuickSuggestion(suggestion: QuickFillSuggestion) {
    if (suggestion.field === "condition" && suggestion.condition) {
      setCondition(suggestion.condition);
      setServerErrorMessage(null);
      return;
    }

    if (suggestion.field === "city") {
      const resolvedCityId =
        suggestion.cityId ||
        cities.find(
          (city) =>
            normalizeCreateQuickSearchText(city.name) ===
            normalizeCreateQuickSearchText(suggestion.value),
        )?.id;
      if (resolvedCityId) setCityId(resolvedCityId);
      setServerErrorMessage(null);
      return;
    }

    if (suggestion.field === "price") {
      const numericValue = suggestion.value.replace(/[^\d]/g, "");
      if (numericValue) setPrice(numericValue);
      setServerErrorMessage(null);
      return;
    }

    if (suggestion.field === "description") {
      setDescription(suggestion.value);
      return;
    }

    if (suggestion.field === "brand") {
      if (dynamicFieldKeysBySuggestion.brand) {
        setSuggestedDynamicValues((previous) => ({
          ...previous,
          [dynamicFieldKeysBySuggestion.brand as string]: suggestion.value,
        }));
      } else {
        appendSuggestionToTitle(suggestion.value);
      }
      return;
    }

    if (suggestion.field === "model") {
      if (dynamicFieldKeysBySuggestion.model) {
        setSuggestedDynamicValues((previous) => ({
          ...previous,
          [dynamicFieldKeysBySuggestion.model as string]: suggestion.value,
        }));
      } else {
        appendSuggestionToTitle(suggestion.value);
      }
      return;
    }

    if (suggestion.field === "year") {
      if (dynamicFieldKeysBySuggestion.year) {
        setSuggestedDynamicValues((previous) => ({
          ...previous,
          [dynamicFieldKeysBySuggestion.year as string]: suggestion.value,
        }));
      } else {
        appendSuggestionToTitle(suggestion.value);
      }
      return;
    }

    if (suggestion.field === "fuel" && dynamicFieldKeysBySuggestion.fuel) {
      setSuggestedDynamicValues((previous) => ({
        ...previous,
        [dynamicFieldKeysBySuggestion.fuel as string]: suggestion.value,
      }));
      return;
    }

    if (
      suggestion.field === "transmission" &&
      dynamicFieldKeysBySuggestion.transmission
    ) {
      setSuggestedDynamicValues((previous) => ({
        ...previous,
        [dynamicFieldKeysBySuggestion.transmission as string]: suggestion.value,
      }));
      return;
    }

    if (suggestion.field === "kilometers" && dynamicFieldKeysBySuggestion.kilometers) {
      setSuggestedDynamicValues((previous) => ({
        ...previous,
        [dynamicFieldKeysBySuggestion.kilometers as string]: suggestion.value,
      }));
      return;
    }

    appendSuggestionToTitle(suggestion.value);
  }

  function applyAllQuickFill() {
    if (!quickFillResult) return;
    if (quickFillResult.categoryCandidates[0]) {
      applyQuickCategoryCandidate(quickFillResult.categoryCandidates[0]);
    }
    quickFillResult.suggestions.forEach((suggestion) => {
      applyQuickSuggestion(suggestion);
    });
    setQuickFillMessage(text.quickFillAppliedAll);
  }

  async function runQuickFill() {
    const input = quickFillLine.trim();
    if (!input) {
      setQuickFillResult(null);
      setQuickFillMessage(text.quickFillInputRequired);
      setQuickFillStatus("idle");
      return;
    }

    setQuickFillStatus("analyzing");
    await Promise.resolve();
    const result = quickFillFromLine({
      text: input,
      locale,
      categories,
      cities,
    });
    setQuickFillResult(result);
    if (result.suggestions.length === 0 && result.categoryCandidates.length === 0) {
      setQuickFillMessage(text.quickFillNoSuggestions);
      setQuickFillStatus("idle");
      return;
    }
    setQuickFillMessage(null);
    setQuickFillStatus("ready");
  }

  function clearSelectedPhotos() {
    if (photosInputRef.current) {
      photosInputRef.current.value = "";
    }
    setPhotoValidationError(null);
    setSelectedPhotosCount(0);
    setPhotoPreviewUrls((previous) => {
      previous.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
  }

  function validateCurrentStep(step: number) {
    if (step === 1) {
      const photosError = validateCreatePhotos(photosInputRef.current?.files ?? null);
      setPhotoValidationError(photosError);
      if (photosError) return photosError;
      return null;
    }

    if (step === 2) {
      if (!title.trim()) return text.titleRequired;
      if (!resolvedSelectedCategoryId) return text.categoryRequired;
      if (!price.trim() || Number(price) <= 0) return text.priceRequired;
      return null;
    }

    if (step === 3 || step === 4) {
      if (!cityId) return text.cityRequired;
      if (!phone.trim()) return text.phoneRequired;
      const normalizedPhoneResult = normalizePhoneInput(phone, phoneCountry, locale);
      if (!normalizedPhoneResult.ok) return normalizedPhoneResult.error;
      return null;
    }

    return null;
  }

  return (
    <form
      action={formAction}
      className="max-w-full min-w-0 space-y-4 overflow-x-hidden pb-2"
      onSubmit={(event) => {
        if (isActionBusy) {
          event.preventDefault();
          return;
        }
        const submitEvent = event.nativeEvent as SubmitEvent;
        const submitter = submitEvent.submitter as
          | HTMLButtonElement
          | HTMLInputElement
          | null;
        const submitIntent = submitter?.value;
        const resolvedIntent =
          submitIntent === "publish" ||
          submitIntent === "draft" ||
          submitIntent === "save-defaults"
            ? submitIntent
            : "publish";
        submitIntentRef.current = resolvedIntent;

        if (resolvedIntent === "save-defaults") {
          setServerErrorMessage(null);
          setServerErrorFieldState(null);
          setNeedsEditListingId(null);
          setStepError(null);
          return;
        }

        const photosError = validateCreatePhotos(photosInputRef.current?.files ?? null);
        setPhotoValidationError(photosError);
        if (photosError) {
          event.preventDefault();
          setCurrentStep(1);
          setStepError(photosError);
          return;
        }
        const basicsError = validateCurrentStep(2);
        if (basicsError) {
          event.preventDefault();
          setCurrentStep(2);
          setStepError(basicsError);
          return;
        }
        const detailsError = validateCurrentStep(3);
        if (detailsError) {
          event.preventDefault();
          setCurrentStep(3);
          setStepError(detailsError);
          return;
        }
        setServerErrorMessage(null);
        setServerErrorFieldState(null);
        setNeedsEditListingId(null);
        setSuccessMessage(null);
        setStepError(null);
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="condition" value={condition} />
      {paymentProvider !== "none" && (
        <input type="hidden" name="paymentProvider" value={paymentProvider} />
      )}

      <CreateListingFormLayout>
        <section className="space-y-1 pb-0.5">
          <p className="text-xl font-semibold tracking-tight sm:text-2xl">{text.createListing}</p>
        </section>

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

        <FormGroup active={currentStep === 2}>
          <CreateListingTitleSection
            titleLabel={text.title}
            placeholder={text.titlePlaceholder}
            helperLabel={text.titleHelper}
            value={title}
            error={titleServerError}
            isActiveStep={currentStep === 2}
            onChange={(value) => {
              setTitle(value);
              setServerErrorMessage(null);
            }}
          />
        </FormGroup>

        <FormGroup active={currentStep === 1}>
          <CreateListingPhotoUploadSection
            photosLabel={text.photos}
            photoHint={text.photoHint}
            resetImagesLabel={text.resetImages}
            isActionBusy={isActionBusy}
            selectedPhotosCount={selectedPhotosCount}
            photoValidationError={photoValidationError}
            photoPreviewUrls={photoPreviewUrls}
            photosInputRef={photosInputRef}
            onClear={clearSelectedPhotos}
            onChange={(files) => {
              const nextError = validateCreatePhotos(files);
              setPhotoValidationError(nextError);
              refreshPhotoPreview(files);
            }}
          />

          <CreateListingQuickFillPanel
            oneLineLabel={text.quickFillOneLine}
            hintLabel={text.quickFillHint}
            promptPlaceholder={text.quickFillPrompt}
            quickFillLabel={text.quickFill}
            quickFillAnalyzingLabel={text.quickFillAnalyzing}
            quickFillReadyLabel={text.quickFillReady}
            suggestionsLabel={text.suggestions}
            categoryCandidatesLabel={text.categoryCandidates}
            applyAllLabel={text.applyAll}
            applyLabel={text.apply}
            categoryLabel={text.category}
            quickFillLine={quickFillLine}
            quickFillMessage={quickFillMessage}
            quickFillStatus={quickFillStatus}
            hasQuickFillSuggestions={hasQuickFillSuggestions}
            quickCategoryCandidates={quickCategoryCandidates}
            quickSuggestions={quickSuggestions}
            categories={categories}
            locale={locale}
            isActionBusy={isActionBusy}
            resolveConfidenceLabel={resolveConfidenceLabel}
            resolveSuggestionLabel={resolveQuickSuggestionLabel}
            resolveSuggestionValue={(suggestion) =>
              suggestion.field === "condition" && suggestion.condition
                ? conditionLabelByValue[suggestion.condition]
                : suggestion.value
            }
            onInputChange={(value) => {
              setQuickFillLine(value);
              setQuickFillMessage(null);
              setQuickFillStatus("idle");
            }}
            onRunQuickFill={() => {
              void runQuickFill();
            }}
            onApplyAll={applyAllQuickFill}
            onApplyCategoryCandidate={applyQuickCategoryCandidate}
            onApplySuggestion={applyQuickSuggestion}
          />
        </FormGroup>

        <FormGroup active={currentStep === 2}>
          <CreateListingPricingSection
            titleLabel={text.pricing}
            priceLabel={text.price}
            pricePlaceholder={text.pricePlaceholder}
            priceHelperLabel={text.priceHelper}
            currencyLabel={text.currency}
            conditionLabel={text.condition}
            conditionLabels={conditionLabelByValue}
            value={price}
            currency={currency}
            condition={condition}
            priceError={priceServerError}
            isActiveStep={currentStep === 2}
            onPriceChange={(value) => {
              setPrice(value);
              setServerErrorMessage(null);
            }}
            onCurrencyChange={setCurrency}
            onConditionChange={setCondition}
          />
        </FormGroup>

        <FormGroup active={currentStep === 2}>
          <CreateListingCategorySection
            titleLabel={text.category}
            categoryLabel={text.category}
            categorySearchLabel={text.categorySearch}
            categorySearchPlaceholder={text.categorySearchPlaceholder}
            categoryRequiredLabel={text.categoryRequired}
            noCategoryMatchLabel={text.noCategoryMatch}
            categorySearch={categorySearch}
            selectedCategoryId={resolvedSelectedCategoryId}
            categoryOptions={categoryOptions}
            categoryError={categoryInlineError}
            locale={locale}
            isActiveStep={currentStep === 2}
            onSearchChange={setCategorySearch}
            onCategoryChange={(value) => {
              setSelectedCategoryId(value);
              setServerErrorMessage(null);
              setStepError(null);
            }}
          />

          <CreateListingLocationContactSection
            mode="location"
            locationTitleLabel={text.location}
            detailsTitleLabel={text.details}
            cityLabel={text.city}
            cityHelperLabel={text.cityHelper}
            noCityAvailableLabel={text.noCityAvailable}
            countryLabel={text.country}
            phoneLabel={text.phone}
            phonePlaceholder={text.phonePlaceholder}
            acceptedPhoneFormatLabel={text.acceptedPhoneFormat}
            cityId={cityId}
            phoneCountry={phoneCountry}
            phone={phone}
            cities={cities}
            cityError={cityServerError}
            phoneError={phoneServerError}
            isActiveStep={currentStep === 3}
            onCityChange={(value) => {
              setCityId(value);
              setServerErrorMessage(null);
            }}
            onPhoneCountryChange={setPhoneCountry}
            onPhoneChange={(value) => {
              setPhone(value);
              setServerErrorMessage(null);
            }}
          />
        </FormGroup>

        <FormGroup active={currentStep === 3}>
          <CreateListingLocationContactSection
            mode="contact"
            locationTitleLabel={text.location}
            detailsTitleLabel={text.details}
            cityLabel={text.city}
            cityHelperLabel={text.cityHelper}
            noCityAvailableLabel={text.noCityAvailable}
            countryLabel={text.country}
            phoneLabel={text.phone}
            phonePlaceholder={text.phonePlaceholder}
            acceptedPhoneFormatLabel={text.acceptedPhoneFormat}
            cityId={cityId}
            phoneCountry={phoneCountry}
            phone={phone}
            cities={cities}
            cityError={cityServerError}
            phoneError={phoneServerError}
            isActiveStep={currentStep === 3}
            onCityChange={(value) => {
              setCityId(value);
              setServerErrorMessage(null);
            }}
            onPhoneCountryChange={setPhoneCountry}
            onPhoneChange={(value) => {
              setPhone(value);
              setServerErrorMessage(null);
            }}
          />

          <CreateListingDescriptionSection
            label={text.description}
            placeholder={text.descriptionPlaceholder}
            value={description}
            onChange={setDescription}
          />

          <CreateListingDynamicFieldsSection
            titleLabel={text.vehicleDetails}
            emptyLabel={text.chooseCategoryToStart}
            categoryId={resolvedSelectedCategoryId}
            templatesByCategory={templatesByCategory}
            initialValues={initial?.dynamicValues}
            suggestedValues={suggestedDynamicValues}
            locale={locale}
          />
        </FormGroup>

        {showPlanSelector && (
          <FormGroup active={currentStep === 4}>
            <CreateListingPlanSection
              titleLabel={text.sellerPackage}
              payPerListingLabel={text.payPerListing}
              daysActiveLabel={text.daysActive30}
              subscriptionLabel={text.subscription}
              monthlyUnlimitedLabel={text.monthlyUnlimited}
              paymentAfterPublishLabel={text.paymentAfterPublish}
              paymentAmount={paymentAmount}
              requiresDummyPayment={requiresDummyPayment}
              value={plan}
              onChange={setPlan}
            />
          </FormGroup>
        )}
      </CreateListingFormLayout>

      <CreateListingActionsBar
        allowDraft={allowDraft}
        requiresDummyPayment={requiresDummyPayment}
        isActionBusy={isActionBusy}
        saveDraftLabel={text.saveDraft}
        publishingLabel={text.publishing}
        publishLabel={resolvedPublishLabel}
        payAndPublishPrefix={text.payAndPublish}
        publishSuffix={text.publishSuffix}
        paymentAmount={paymentAmount}
        onOpenPaymentPanel={() => setShowPaymentPanel(true)}
      />

      {requiresDummyPayment && (
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
        />
      )}
    </form>
  );
}

function FormGroup({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <section
      className={`space-y-4 rounded-2xl bg-card/72 p-4 ring-1 ring-black/5 sm:p-5 dark:ring-white/10 ${
        active ? "ring-primary/25" : ""
      }`}
    >
      {children}
    </section>
  );
}
