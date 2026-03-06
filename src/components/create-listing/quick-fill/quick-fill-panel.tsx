"use client";

import { Wand2 } from "lucide-react";
import type { CreateListingCategory } from "@/components/create-listing/types";
import { CreateListingSuggestionRow } from "@/components/create-listing/suggestion-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localizeCategoryName } from "@/lib/category-label";
import type { QuickFillCategoryCandidate, QuickFillSuggestion } from "@/lib/quick-fill";

type Props = {
  oneLineLabel: string;
  hintLabel: string;
  promptPlaceholder: string;
  quickFillLabel: string;
  quickFillAnalyzingLabel: string;
  quickFillReadyLabel: string;
  suggestionsLabel: string;
  categoryCandidatesLabel: string;
  applyAllLabel: string;
  applyLabel: string;
  categoryLabel: string;
  quickFillLine: string;
  quickFillMessage: string | null;
  quickFillStatus: "idle" | "analyzing" | "ready";
  hasQuickFillSuggestions: boolean;
  quickCategoryCandidates: QuickFillCategoryCandidate[];
  quickSuggestions: QuickFillSuggestion[];
  categories: CreateListingCategory[];
  locale: "en" | "mk";
  isActionBusy: boolean;
  resolveConfidenceLabel: (confidence: "high" | "medium" | "low") => string;
  resolveSuggestionLabel: (suggestion: QuickFillSuggestion) => string;
  resolveSuggestionValue: (suggestion: QuickFillSuggestion) => string;
  onInputChange: (value: string) => void;
  onRunQuickFill: () => void;
  onApplyAll: () => void;
  onApplyCategoryCandidate: (candidate: QuickFillCategoryCandidate) => void;
  onApplySuggestion: (suggestion: QuickFillSuggestion) => void;
};

export function CreateListingQuickFillPanel({
  oneLineLabel,
  hintLabel,
  promptPlaceholder,
  quickFillLabel,
  quickFillAnalyzingLabel,
  quickFillReadyLabel,
  suggestionsLabel,
  categoryCandidatesLabel,
  applyAllLabel,
  applyLabel,
  categoryLabel,
  quickFillLine,
  quickFillMessage,
  quickFillStatus,
  hasQuickFillSuggestions,
  quickCategoryCandidates,
  quickSuggestions,
  categories,
  locale,
  isActionBusy,
  resolveConfidenceLabel,
  resolveSuggestionLabel,
  resolveSuggestionValue,
  onInputChange,
  onRunQuickFill,
  onApplyAll,
  onApplyCategoryCandidate,
  onApplySuggestion,
}: Props) {
  return (
    <details className="rounded-xl border border-border/45 bg-muted/5 p-3">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground">{oneLineLabel}</summary>
      <div className="mt-3 space-y-3">
        <p className="text-xs text-muted-foreground">{hintLabel}</p>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            value={quickFillLine}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              onRunQuickFill();
            }}
            placeholder={promptPlaceholder}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onRunQuickFill}
            disabled={isActionBusy}
            className="gap-1 text-xs"
          >
            <Wand2 size={14} />
            {quickFillLabel}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quickFillStatus === "analyzing" ? (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {quickFillAnalyzingLabel}
            </span>
          ) : null}
          {quickFillStatus === "ready" || hasQuickFillSuggestions ? (
            <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
              {quickFillReadyLabel}
            </span>
          ) : null}
        </div>

        {quickFillMessage ? (
          <p className="text-xs font-medium text-muted-foreground">{quickFillMessage}</p>
        ) : null}

        {hasQuickFillSuggestions ? (
          <div className="space-y-2">
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
  );
}
