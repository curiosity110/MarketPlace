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
  visibleTemplateKeys?: string[];
  includeFormNames?: boolean;
  onValuesChange?: (values: Record<string, string>) => void;
  compact?: boolean;
  showHeader?: boolean;
};

export function CreateListingDynamicFieldsSection({
  titleLabel,
  emptyLabel,
  categoryId,
  templatesByCategory,
  initialValues,
  suggestedValues,
  locale,
  visibleTemplateKeys,
  includeFormNames,
  onValuesChange,
  compact,
  showHeader,
}: Props) {
  const shouldShowTitle = titleLabel.trim().length > 0;

  return (
    <div className="space-y-2.5">
      {shouldShowTitle ? (
        <p className="text-[0.95rem] font-semibold tracking-tight text-foreground">
          {titleLabel}
        </p>
      ) : null}
      {categoryId ? (
        <DynamicFieldsEditor
          key={categoryId}
          categoryId={categoryId}
          templatesByCategory={templatesByCategory}
          initialValues={initialValues}
          suggestedValues={suggestedValues}
          locale={locale}
          visibleTemplateKeys={visibleTemplateKeys}
          includeFormNames={includeFormNames}
          onValuesChange={onValuesChange}
          compact={compact}
          showHeader={showHeader}
        />
      ) : (
        <p className="text-[0.92rem] leading-6 text-[#74685c]">{emptyLabel}</p>
      )}
    </div>
  );
}
