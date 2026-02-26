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
  categorySlugById: Record<string, string>;
  templatesByCategory: Record<string, Template[]>;
  initialValues?: Record<string, string>;
};

const demoValues: Record<string, Record<string, string>> = {
  cars: { brand: "Volkswagen", model: "Golf 7", year: "2017", km: "124000", fuel: "Diesel", transmission: "Manual" },
  "real-estate": { sqm: "78", rooms: "3", floor: "4", furnished: "true", heating: "Central" },
  electronics: { brand: "Samsung", model: "QLED Q80", specs: "4K Smart TV, HDMI 2.1" },
  jobs: { company: "Skopje Tech", position: "Frontend Developer", salary: "1600", remote: "true", contract: "Full-time" },
  services: { serviceType: "Repair", availability: "Mon-Sat 08:00 - 17:00" },
  furniture: { material: "Wood", dimensions: "200x90x75 cm", color: "Brown" },
  phones: { brand: "Apple", model: "iPhone 14", storage: "128GB", condition: "Used", warranty: "false" },
  fashion: { size: "M", brand: "Zara", color: "Black" },
};

const presetValues: Record<string, Record<string, Record<string, string>>> = {
  cars: {
    Economy: { fuel: "Diesel", transmission: "Manual" },
    Sport: { fuel: "Petrol", transmission: "Automatic" },
    SUV: { fuel: "Diesel", transmission: "Automatic" },
  },
  jobs: {
    Remote: { remote: "true" },
    "On-site": { remote: "false" },
  },
};

export function DynamicFieldsEditor({ categoryId, categorySlugById, templatesByCategory, initialValues = {} }: Props) {
  const templates = useMemo(() => templatesByCategory[categoryId] ?? [], [templatesByCategory, categoryId]);
  const initialTemplateValues = useMemo(() => {
    const nextValues: Record<string, string> = {};
    for (const template of templates) {
      nextValues[template.key] = initialValues[template.key] ?? "";
    }
    return nextValues;
  }, [templates, initialValues]);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(initialTemplateValues);

  const categorySlug = useMemo(() => categorySlugById[categoryId] ?? "", [categoryId, categorySlugById]);
  const availablePresets = presetValues[categorySlug] ?? {};

  function updateField(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  function autofillDemo() {
    const next = { ...fieldValues };
    const source = demoValues[categorySlug] ?? {};

    for (const template of templates) {
      next[template.key] = source[template.key] ?? next[template.key] ?? "";
    }

    setFieldValues(next);
  }

  function clearFields() {
    const cleared: Record<string, string> = {};
    for (const template of templates) {
      cleared[template.key] = "";
    }
    setFieldValues(cleared);
  }

  function applyPreset(name: string) {
    const preset = availablePresets[name];
    if (!preset) return;
    setFieldValues((prev) => ({ ...prev, ...preset }));
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/70 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground">Smart Buttons</p>
        <Button type="button" variant="outline" onClick={autofillDemo}>Auto-fill demo data</Button>
        <Button type="button" variant="ghost" onClick={clearFields}>Clear fields</Button>
        {Object.keys(availablePresets).length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Quick presets:</span>
            {Object.keys(availablePresets).map((preset) => (
              <Button key={preset} type="button" variant="outline" onClick={() => applyPreset(preset)} className="px-2 py-1 text-xs">
                {preset}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((template) => {
          const name = `${DYNAMIC_FIELD_PREFIX}${template.key}`;
          const value = fieldValues[template.key] ?? "";

          return (
            <label key={template.id} className="space-y-1 text-sm">
              <span className="font-medium">
                {template.label}
                {template.required && <span className="ml-1 text-destructive">*</span>}
              </span>
              {template.type === CategoryFieldType.TEXT && (
                <Input name={name} value={value} onChange={(e) => updateField(template.key, e.target.value)} placeholder={template.label} />
              )}
              {template.type === CategoryFieldType.NUMBER && (
                <Input name={name} type="number" value={value} onChange={(e) => updateField(template.key, e.target.value)} placeholder={template.label} />
              )}
              {template.type === CategoryFieldType.SELECT && (
                <Select name={name} value={value} onChange={(e) => updateField(template.key, e.target.value)}>
                  <option value="">Select {template.label}</option>
                  {template.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
              )}
              {template.type === CategoryFieldType.BOOLEAN && (
                <Select name={name} value={value} onChange={(e) => updateField(template.key, e.target.value)}>
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              )}
            </label>
          );
        })}
      </div>

      {templates.length === 0 && <p className="text-sm text-muted-foreground">No dynamic fields for this category.</p>}
    </div>
  );
}
