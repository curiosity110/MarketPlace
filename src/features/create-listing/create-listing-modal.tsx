"use client";

import { CreateListingModalShell } from "@/components/create-listing/modal-shell";
import { ListingForm } from "@/components/listing-form";
import type {
  CreateListingCategory,
  CreateListingCity,
  CreateListingTemplate,
} from "@/components/create-listing/types";
import { CreateListingForm } from "@/features/create-listing/create-listing-form";
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

  return (
    <CreateListingModalShell
      isOpen={isOpen}
      isActive={isActive}
      closeLabel={text.closeCreateListingForm}
      onClose={onClose}
    >
      <div
        className={`relative mx-auto flex h-[100dvh] w-full min-w-0 max-w-[620px] flex-col overflow-hidden bg-background shadow-[0_30px_80px_-44px_rgba(48,35,24,0.42)] ring-1 ring-black/8 transition-all duration-200 sm:h-auto sm:max-h-[92dvh] sm:rounded-[1.9rem] sm:border sm:border-white/35 dark:ring-white/10 ${
          isActive
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-[0.99] opacity-0"
        }`}
      >
        {initial?.id ? (
          <div className="flex-1 min-w-0 overflow-y-auto overscroll-contain">
            <div className="px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
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
          </div>
        ) : (
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
        )}
      </div>
    </CreateListingModalShell>
  );
}
