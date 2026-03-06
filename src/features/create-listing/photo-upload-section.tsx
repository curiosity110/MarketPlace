"use client";

import Image from "next/image";
import { ImagePlus, Wand2 } from "lucide-react";
import type { RefObject } from "react";
import { CreateListingSuggestionRow } from "@/components/create-listing/suggestion-row";
import { Button } from "@/components/ui/button";
import { FormBlock } from "@/components/ui/layout";
import { Input } from "@/components/ui/input";
import { localizeCategoryName } from "@/lib/category-label";
import type { QuickFillCategoryCandidate, QuickFillSuggestion } from "@/lib/quick-fill";
import type { CreateListingCategoryOption } from "@/features/create-listing/types";

type Props = {
  title: string;
  description: string;
  photosLabel: string;
  photoHint: string;
  choosePhotosLabel: string;
  resetImagesLabel: string;
  selectedPhotosCount: number;
  selectedPhotosLabel: string;
  addPhotosFirstLabel: string;
  photoValidationError: string | null;
  photoPreviewUrls: string[];
  photosInputRef: RefObject<HTMLInputElement | null>;
  isActionBusy: boolean;
  quickFillTitle: string;
  quickFillHint: string;
  quickFillPrompt: string;
  quickFillActionLabel: string;
  quickFillMessage: string | null;
  quickFillLine: string;
  hasQuickFillSuggestions: boolean;
  quickCategoryCandidates: QuickFillCategoryCandidate[];
  quickSuggestions: QuickFillSuggestion[];
  categories: CreateListingCategoryOption[];
  locale: "en" | "mk";
  applyLabel: string;
  categoryLabel: string;
  resolveConfidenceLabel: (confidence: "high" | "medium" | "low") => string;
  resolveSuggestionLabel: (suggestion: QuickFillSuggestion) => string;
  resolveSuggestionValue: (suggestion: QuickFillSuggestion) => string;
  onClear: () => void;
  onChange: (files: FileList | null) => void;
  onQuickFillInputChange: (value: string) => void;
  onRunQuickFill: () => void;
  onApplyAll: () => void;
  onApplyCategoryCandidate: (candidate: QuickFillCategoryCandidate) => void;
  onApplySuggestion: (suggestion: QuickFillSuggestion) => void;
  applyAllLabel: string;
  suggestionsLabel: string;
  categoryCandidatesLabel: string;
};

export function PhotoUploadSection({
  title,
  description,
  photosLabel,
  photoHint,
  choosePhotosLabel,
  resetImagesLabel,
  selectedPhotosCount,
  selectedPhotosLabel,
  addPhotosFirstLabel,
  photoValidationError,
  photoPreviewUrls,
  photosInputRef,
  isActionBusy,
  quickFillTitle,
  quickFillHint,
  quickFillPrompt,
  quickFillActionLabel,
  quickFillMessage,
  quickFillLine,
  hasQuickFillSuggestions,
  quickCategoryCandidates,
  quickSuggestions,
  categories,
  locale,
  applyLabel,
  categoryLabel,
  resolveConfidenceLabel,
  resolveSuggestionLabel,
  resolveSuggestionValue,
  onClear,
  onChange,
  onQuickFillInputChange,
  onRunQuickFill,
  onApplyAll,
  onApplyCategoryCandidate,
  onApplySuggestion,
  applyAllLabel,
  suggestionsLabel,
  categoryCandidatesLabel,
}: Props) {
  return (
    <FormBlock title={title} description={description} className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">{photosLabel}</p>
            <p className="text-xs text-muted-foreground">{photoHint}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClear}
            disabled={selectedPhotosCount === 0 || isActionBusy}
          >
            {resetImagesLabel}
          </Button>
        </div>

        <label className="flex cursor-pointer flex-col gap-3 rounded-[1.1rem] border border-dashed border-border/70 bg-muted/20 p-4 transition-colors hover:border-primary/35 hover:bg-primary/5 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border/60">
              <ImagePlus size={18} className="text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold tracking-tight">{choosePhotosLabel}</p>
              <p className="text-sm text-muted-foreground">
                {selectedPhotosCount > 0
                  ? `${selectedPhotosCount} ${selectedPhotosLabel}`
                  : addPhotosFirstLabel}
              </p>
            </div>
          </div>

          {photoPreviewUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photoPreviewUrls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted ring-1 ring-border/50"
                >
                  <Image
                    src={url}
                    alt={`Selected photo ${index + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 30vw, 160px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <input
            ref={photosInputRef}
            name="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => onChange(event.target.files)}
            className="sr-only"
          />
        </label>

        {photoValidationError ? (
          <p className="text-sm text-destructive">{photoValidationError}</p>
        ) : null}
      </div>

      <details className="rounded-[1rem] border border-border/50 bg-background/70 p-3">
        <summary className="cursor-pointer list-none">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <Wand2 size={16} className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{quickFillTitle}</p>
              <p className="text-xs text-muted-foreground">{quickFillHint}</p>
            </div>
          </div>
        </summary>

        <div className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              value={quickFillLine}
              onChange={(event) => onQuickFillInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                onRunQuickFill();
              }}
              placeholder={quickFillPrompt}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={onRunQuickFill}
              disabled={isActionBusy}
              className="gap-2"
            >
              <Wand2 size={14} />
              {quickFillActionLabel}
            </Button>
          </div>

          {quickFillMessage ? (
            <p className="text-xs text-muted-foreground">{quickFillMessage}</p>
          ) : null}

          {hasQuickFillSuggestions ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {suggestionsLabel}
                </p>
                <Button type="button" size="sm" variant="ghost" onClick={onApplyAll}>
                  {applyAllLabel}
                </Button>
              </div>

              {quickCategoryCandidates.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {categoryCandidatesLabel}
                  </p>
                  {quickCategoryCandidates.map((candidate) => {
                    const candidateCategory = categories.find(
                      (category) => category.id === candidate.categoryId,
                    );
                    const valueLabel = candidateCategory
                      ? localizeCategoryName(candidateCategory, locale)
                      : candidate.label;

                    return (
                      <CreateListingSuggestionRow
                        key={`category-${candidate.categoryId}-${candidate.confidence}`}
                        label={categoryLabel}
                        value={valueLabel}
                        confidenceLabel={resolveConfidenceLabel(candidate.confidence)}
                        applyLabel={applyLabel}
                        onApply={() => onApplyCategoryCandidate(candidate)}
                      />
                    );
                  })}
                </div>
              ) : null}

              {quickSuggestions.map((suggestion, index) => (
                <CreateListingSuggestionRow
                  key={`suggestion-${suggestion.field}-${suggestion.value}-${index}`}
                  label={resolveSuggestionLabel(suggestion)}
                  value={resolveSuggestionValue(suggestion)}
                  confidenceLabel={resolveConfidenceLabel(suggestion.confidence)}
                  applyLabel={applyLabel}
                  onApply={() => onApplySuggestion(suggestion)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </details>
    </FormBlock>
  );
}
