"use client";

import { useMemo, useState } from "react";
import { CategoryFieldType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DYNAMIC_FIELD_PREFIX } from "@/lib/listing-fields";

type Template = {
  id: string;
  key: string;
  label: string;
  type: CategoryFieldType;
  required: boolean;
  order: number;
  options: string[];
};

type Props = {
  categoryId: string;
  templatesByCategory: Record<string, Template[]>;
  initialValues?: Record<string, string>;
  locale?: "en" | "mk";
};

export function DynamicFieldsEditor({
  categoryId,
  templatesByCategory,
  initialValues = {},
  locale = "en",
}: Props) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        noAdditionalFields: "Нема дополнителни полиња за оваа категорија.",
        categoryFields: "Полиња на категорија",
        clear: "Исчисти",
        select: "Избери",
        yes: "Да",
        no: "Не",
      }
    : {
        noAdditionalFields: "No additional fields for this category.",
        categoryFields: "Category fields",
        clear: "Clear",
        select: "Select",
        yes: "Yes",
        no: "No",
      };

  const templates = useMemo(
    () => templatesByCategory[categoryId] ?? [],
    [templatesByCategory, categoryId],
  );

  const initialTemplateValues = useMemo(() => {
    const nextValues: Record<string, string> = {};
    for (const template of templates) {
      nextValues[template.key] = initialValues[template.key] ?? "";
    }
    return nextValues;
  }, [templates, initialValues]);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    initialTemplateValues,
  );

  function updateField(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  function clearFields() {
    const cleared: Record<string, string> = {};
    templates.forEach((template) => {
      cleared[template.key] = "";
    });
    setFieldValues(cleared);
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        {text.noAdditionalFields}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-muted-foreground">
          {text.categoryFields}
        </p>
        <Button type="button" size="sm" variant="ghost" onClick={clearFields}>
          {text.clear}
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {templates.map((template, index) => {
          const name = `${DYNAMIC_FIELD_PREFIX}${template.key}`;
          const value = fieldValues[template.key] ?? "";
          const isLastOddItem = templates.length % 2 === 1 && index === templates.length - 1;

          return (
            <label
              key={template.id}
              className={`space-y-1 text-sm ${isLastOddItem ? "md:col-span-2" : ""}`}
            >
              <span className="font-medium">
                {template.label}
                {template.required && (
                  <span className="ml-1 text-destructive">*</span>
                )}
              </span>

              {template.type === CategoryFieldType.TEXT && (
                <Input
                  name={name}
                  value={value}
                  onChange={(event) => updateField(template.key, event.target.value)}
                  placeholder={template.label}
                />
              )}

              {template.type === CategoryFieldType.NUMBER && (
                <Input
                  name={name}
                  type="number"
                  value={value}
                  onChange={(event) => updateField(template.key, event.target.value)}
                  placeholder={template.label}
                />
              )}

              {template.type === CategoryFieldType.SELECT && (
                <Select
                  name={name}
                  value={value}
                  onChange={(event) => updateField(template.key, event.target.value)}
                >
                  <option value="">
                    {text.select} {template.label}
                  </option>
                  {template.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              )}

              {template.type === CategoryFieldType.BOOLEAN && (
                <Select
                  name={name}
                  value={value}
                  onChange={(event) => updateField(template.key, event.target.value)}
                >
                  <option value="">{text.select}</option>
                  <option value="true">{text.yes}</option>
                  <option value="false">{text.no}</option>
                </Select>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
