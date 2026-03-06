"use client";

import { DynamicFieldsEditor } from "@/components/dynamic-fields-editor";
import type { CreateListingTemplate } from "@/components/create-listing/types";

type Props = {
  titleLabel: string;
  emptyLabel: string;
  categoryId: string;
  templatesByCategory: Record<string, CreateListingTemplate[]>;
  initialValues?: Record<string, string>;
  suggestedValues?: Record<string, string>;
  locale: "en" | "mk";
};

export function CreateListingDynamicFieldsSection({
  titleLabel,
  emptyLabel,
  categoryId,
  templatesByCategory,
  initialValues,
  suggestedValues,
  locale,
}: Props) {
  return (
    <div className="space-y-2 rounded-2xl bg-card/80 p-4 ring-1 ring-border/60 sm:p-5">
      <p className="text-sm font-semibold tracking-tight">{titleLabel}</p>
      {categoryId ? (
        <DynamicFieldsEditor
          key={categoryId}
          categoryId={categoryId}
          templatesByCategory={templatesByCategory}
          initialValues={initialValues}
          suggestedValues={suggestedValues}
          locale={locale}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}
