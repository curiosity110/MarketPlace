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
  suggestedValues?: Record<string, string>;
  locale?: "en" | "mk";
};

const CAR_BRANDS = [
  "Audi",
  "BMW",
  "Chevrolet",
  "Citroen",
  "Dacia",
  "Fiat",
  "Ford",
  "Honda",
  "Hyundai",
  "Jeep",
  "Kia",
  "Mazda",
  "Mercedes-Benz",
  "Mitsubishi",
  "Nissan",
  "Opel",
  "Peugeot",
  "Porsche",
  "Renault",
  "Seat",
  "Skoda",
  "Suzuki",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

const CAR_MODELS_BY_BRAND: Record<string, string[]> = {
  audi: ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
  bmw: ["1 Series", "3 Series", "5 Series", "X1", "X3", "X5"],
  citroen: ["C3", "C4", "C5", "Berlingo"],
  dacia: ["Duster", "Sandero", "Logan"],
  fiat: ["500", "Panda", "Punto", "Tipo"],
  ford: ["Fiesta", "Focus", "Mondeo", "Kuga"],
  honda: ["Civic", "Accord", "CR-V"],
  hyundai: ["i10", "i20", "i30", "Tucson", "Santa Fe"],
  kia: ["Rio", "Ceed", "Sportage", "Sorento"],
  mazda: ["Mazda 2", "Mazda 3", "Mazda 6", "CX-5"],
  "mercedes-benz": ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "GLE"],
  mitsubishi: ["Colt", "Lancer", "Outlander"],
  nissan: ["Micra", "Qashqai", "X-Trail"],
  opel: ["Astra", "Corsa", "Insignia", "Mokka"],
  peugeot: ["208", "308", "3008", "5008"],
  porsche: ["Cayenne", "Macan", "Panamera"],
  renault: ["Clio", "Megane", "Captur", "Kadjar"],
  seat: ["Ibiza", "Leon", "Ateca"],
  skoda: ["Fabia", "Octavia", "Superb", "Kodiaq"],
  suzuki: ["Swift", "Vitara", "SX4"],
  tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  toyota: ["Yaris", "Corolla", "RAV4", "Auris"],
  volkswagen: ["Golf", "Passat", "Polo", "Tiguan", "Touareg"],
  volvo: ["S60", "V60", "XC40", "XC60", "XC90"],
};

function normalizeFieldIdentifier(template: Pick<Template, "key" | "label">) {
  return `${template.key} ${template.label}`.toLowerCase();
}

function isBrandField(template: Pick<Template, "key" | "label">) {
  const id = normalizeFieldIdentifier(template);
  return id.includes("brand") || id.includes("make") || id.includes("марка");
}

function isModelField(template: Pick<Template, "key" | "label">) {
  const id = normalizeFieldIdentifier(template);
  return id.includes("model") || id.includes("модел");
}

function isYearField(template: Pick<Template, "key" | "label">) {
  const id = normalizeFieldIdentifier(template);
  return id.includes("year") || id.includes("година");
}

export function DynamicFieldsEditor({
  categoryId,
  templatesByCategory,
  initialValues = {},
  suggestedValues = {},
  locale = "en",
}: Props) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
      noAdditionalFields: "Нема дополнителни полиња за оваа категорија.",
      categoryFields: "Полиња на категорија",
      clear: "Исчисти",
      select: "Избери",
      searchOrSelect: "Внеси или избери",
      yes: "Да",
      no: "Не",
    }
    : {
      noAdditionalFields: "No additional fields for this category.",
      categoryFields: "Category fields",
      clear: "Clear",
      select: "Select",
      searchOrSelect: "Type or select",
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

  const [fieldOverrides, setFieldOverrides] = useState<Record<string, string>>({});
  const templateKeySet = useMemo(
    () => new Set(templates.map((template) => template.key)),
    [templates],
  );
  const suggestedTemplateValues = useMemo(() => {
    const nextValues: Record<string, string> = {};
    Object.entries(suggestedValues).forEach(([key, value]) => {
      if (!templateKeySet.has(key)) return;
      if (typeof value !== "string") return;
      const nextValue = value.trim();
      if (!nextValue) return;
      nextValues[key] = value;
    });
    return nextValues;
  }, [suggestedValues, templateKeySet]);
  const baseFieldValues = useMemo(
    () => ({ ...initialTemplateValues, ...suggestedTemplateValues }),
    [initialTemplateValues, suggestedTemplateValues],
  );
  const fieldValues = useMemo(() => {
    const nextValues = { ...baseFieldValues };
    Object.entries(fieldOverrides).forEach(([key, value]) => {
      if (!templateKeySet.has(key)) return;
      nextValues[key] = value;
    });
    return nextValues;
  }, [baseFieldValues, fieldOverrides, templateKeySet]);

  function updateField(key: string, value: string) {
    setFieldOverrides((prev) => {
      const baseValue = baseFieldValues[key] ?? "";
      if (value === baseValue) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }

  function clearFields() {
    const cleared: Record<string, string> = {};
    templates.forEach((template) => {
      cleared[template.key] = "";
    });
    setFieldOverrides(cleared);
  }

  const selectedBrand = useMemo(() => {
    const brandTemplate = templates.find((template) => isBrandField(template));
    if (!brandTemplate) return "";
    return (fieldValues[brandTemplate.key] || "").trim().toLowerCase();
  }, [fieldValues, templates]);

  function resolveSelectOptions(template: Template) {
    if (template.type !== CategoryFieldType.SELECT) return template.options;
    if (template.options.length > 0) return template.options;

    if (isBrandField(template)) {
      return CAR_BRANDS;
    }

    if (isModelField(template)) {
      const byBrand = selectedBrand
        ? CAR_MODELS_BY_BRAND[selectedBrand]
        : undefined;
      if (byBrand && byBrand.length > 0) return byBrand;
      return Object.values(CAR_MODELS_BY_BRAND)
        .flat()
        .slice(0, 30);
    }

    return [];
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-[1rem] border border-dashed border-border/80 bg-background/45 p-4 text-sm text-[#74685c]">
        {text.noAdditionalFields}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[1rem] border border-border/60 bg-[#f7f3ee] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#5f544a]">
          {text.categoryFields}
        </p>
        <Button type="button" size="sm" variant="ghost" onClick={clearFields}>
          {text.clear}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((template, index) => {
          const name = `${DYNAMIC_FIELD_PREFIX}${template.key}`;
          const value = fieldValues[template.key] ?? "";
          const isLastOddItem = templates.length % 2 === 1 && index === templates.length - 1;

          return (
            <label
              key={template.id}
              className={`space-y-1.5 text-sm ${isLastOddItem ? "md:col-span-2" : ""}`}
            >
              <span className="font-medium text-foreground">
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
                  min={isYearField(template) ? 1900 : undefined}
                  max={isYearField(template) ? new Date().getFullYear() + 1 : undefined}
                  value={value}
                  onChange={(event) => updateField(template.key, event.target.value)}
                  placeholder={template.label}
                />
              )}

              {template.type === CategoryFieldType.SELECT &&
                (() => {
                  const options = resolveSelectOptions(template);
                  const isSearchable =
                    options.length >= 10 ||
                    isBrandField(template) ||
                    isModelField(template);

                  if (isSearchable) {
                    const datalistId = `dynamic-options-${template.id}`;
                    return (
                      <>
                        <Input
                          name={name}
                          value={value}
                          onChange={(event) =>
                            updateField(template.key, event.target.value)
                          }
                          placeholder={`${text.searchOrSelect} ${template.label.toLowerCase()}`}
                          list={datalistId}
                          autoComplete="off"
                        />
                        <datalist id={datalistId}>
                          {options.map((option) => (
                            <option key={option} value={option} />
                          ))}
                        </datalist>
                      </>
                    );
                  }

                  return (
                    <Select
                      name={name}
                      value={value}
                      onChange={(event) =>
                        updateField(template.key, event.target.value)
                      }
                    >
                      <option value="">
                        {text.select} {template.label}
                      </option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  );
                })()}

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
