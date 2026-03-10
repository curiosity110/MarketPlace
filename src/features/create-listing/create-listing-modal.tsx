"use client";

import { CreateListingModalShell } from "@/components/create-listing/modal-shell";
import { ListingForm } from "@/components/listing-form";
import type {
  CreateListingCategory,
  CreateListingCity,
  CreateListingTemplate,
} from "@/components/create-listing/types";
import { CreateListingFormNew } from "@/features/create-listing/create-listing-form-new";
import type { CreateListingInitialValues } from "@/features/create-listing/types";
import { getCreateListingModalText } from "@/features/create-listing/utils";

type Props = {
  isOpen: boolean;
  isActive: boolean;
  onClose: () => void;
  action: (formData: FormData) => Promise<unknown> | unknown;
  categories: CreateListingCategory[];
  cities: CreateListingCity[];
  templatesByCategory: Record<string, CreateListingTemplate[]>;
  allowDraft?: boolean;
  showPlanSelector?: boolean;
  publishLabel?: string;
  paymentProvider?: "none" | "stripe-dummy";
  initial?: CreateListingInitialValues;
  locale?: "en" | "mk";
  serverError?: string | null;
  serverErrorField?: string | null;
  defaultsSaved?: boolean;
};

export function CreateListingModal({
  isOpen,
  isActive,
  onClose,
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
  serverError,
  serverErrorField,
  defaultsSaved = false,
}: Props) {
  const text = getCreateListingModalText(locale);
  const panelClassName = `relative mx-auto flex h-[100dvh] w-full min-w-0 max-w-[620px] flex-col overflow-hidden bg-background shadow-[0_30px_80px_-44px_rgba(48,35,24,0.42)] ring-1 ring-black/8 transition-all duration-200 sm:h-auto sm:max-h-[92dvh] sm:rounded-[1.9rem] sm:border sm:border-white/35 dark:ring-white/10 ${
    isActive
      ? "translate-y-0 scale-100 opacity-100"
      : "translate-y-2 scale-[0.99] opacity-0"
  }`;

  return (
    <CreateListingModalShell
      isOpen={isOpen}
      isActive={isActive}
      closeLabel={text.closeCreateListingForm}
      onClose={onClose}
    >
      <div className={panelClassName}>
        <CreateListingModalContent
          action={action}
          categories={categories}
          cities={cities}
          templatesByCategory={templatesByCategory}
          allowDraft={allowDraft}
          showPlanSelector={showPlanSelector}
          publishLabel={publishLabel}
          paymentProvider={paymentProvider}
          initial={initial}
          locale={locale}
          serverError={serverError}
          serverErrorField={serverErrorField}
          defaultsSaved={defaultsSaved}
          onClose={onClose}
        />
      </div>
    </CreateListingModalShell>
  );
}

function CreateListingModalContent({
  action,
  categories,
  cities,
  templatesByCategory,
  allowDraft,
  showPlanSelector,
  publishLabel,
  paymentProvider,
  initial,
  locale,
  serverError,
  serverErrorField,
  defaultsSaved,
  onClose,
}: Omit<Props, "isOpen" | "isActive">) {
  const isMk = locale === "mk";
  if (categories.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {isMk
            ? "Нема достапни категории за огласување. Обидете се подоцна или контактирајте го тимот."
            : "No categories available for listing. Please try again later or contact support."}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          {isMk ? "Затвори" : "Close"}
        </button>
      </div>
    );
  }
  if (initial?.id) {
    return (
      <div className="flex-1 min-w-0 overflow-y-auto overscroll-contain px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
        <ListingForm
          action={action}
          categories={categories}
          cities={cities}
          templatesByCategory={templatesByCategory}
          allowDraft={allowDraft}
          showPlanSelector={showPlanSelector}
          publishLabel={publishLabel}
          paymentProvider={paymentProvider}
          initial={initial}
          locale={locale}
        />
      </div>
    );
  }

  return (
    <CreateListingFormNew
      action={action}
      categories={categories}
      cities={cities}
      templatesByCategory={templatesByCategory}
      allowDraft={allowDraft}
      showPlanSelector={showPlanSelector}
      publishLabel={publishLabel}
      paymentProvider={paymentProvider}
      initial={initial}
      locale={locale}
      serverError={serverError}
      serverErrorField={serverErrorField}
      defaultsSaved={defaultsSaved}
      onPublished={onClose}
      onClose={onClose}
    />
  );
}
