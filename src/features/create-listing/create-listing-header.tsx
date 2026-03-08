"use client";

import { ArrowLeft, X } from "lucide-react";
import type { CreateListingWizardStep } from "@/features/create-listing/types";

type Props = {
  currentStep: CreateListingWizardStep;
  totalSteps: number;
  stepTitle: string;
  backLabel: string;
  closeLabel: string;
  canGoBack: boolean;
  onBack: () => void;
  onClose: () => void;
};

export function CreateListingHeader({
  currentStep,
  totalSteps,
  stepTitle,
  backLabel,
  closeLabel,
  canGoBack,
  onBack,
  onClose,
}: Props) {
  const progress = `${(currentStep / totalSteps) * 100}%`;

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {canGoBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="h-9 w-9 shrink-0" aria-hidden="true" />
          )}

          <p className="truncate text-sm font-medium text-foreground">
            {currentStep} of {totalSteps} · {stepTitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>

      <div className="h-px w-full bg-border/50">
        <div className="h-full bg-foreground transition-all duration-300" style={{ width: progress }} />
      </div>
    </div>
  );
}
