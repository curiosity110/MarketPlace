"use client";

import { useMemo, useState } from "react";
import { ListingCondition } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DynamicFieldsEditor } from "@/components/dynamic-fields-editor";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Category = { id: string; name: string; slug: string };
type City = { id: string; name: string };
type Template = {
  id: string;
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN";
  required: boolean;
  order: number;
  options: string[];
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  cities: City[];
  templatesByCategory: Record<string, Template[]>;
  initial?: {
    id?: string;
    title?: string;
    description?: string;
    price?: number;
    condition?: ListingCondition;
    categoryId?: string;
    cityId?: string;
    dynamicValues?: Record<string, string>;
  };
};

export function ListingForm({ action, categories, cities, templatesByCategory, initial }: Props) {
  const initialCategory = initial?.categoryId ?? categories[0]?.id ?? "";
  const [categoryId, setCategoryId] = useState(initialCategory);
  const categorySlugById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.slug])),
    [categories],
  );

  return (
    <form action={action} className="grid gap-3">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <Input name="title" defaultValue={initial?.title} placeholder="Listing title" required minLength={5} />
      <textarea
        name="description"
        defaultValue={initial?.description}
        className="min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Description"
        required
      />
      <Input type="number" step="0.01" min="0" name="price" defaultValue={initial?.price ?? 0} placeholder="Price" required />
      <div className="grid gap-3 sm:grid-cols-3">
        <Select name="condition" defaultValue={initial?.condition ?? ListingCondition.USED}>
          {Object.values(ListingCondition).map((condition) => (
            <option key={condition} value={condition}>{condition}</option>
          ))}
        </Select>
        <Select name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </Select>
        <Select name="cityId" defaultValue={initial?.cityId ?? cities[0]?.id}>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </Select>
      </div>

      <DynamicFieldsEditor
        key={categoryId}
        categoryId={categoryId}
        categorySlugById={categorySlugById}
        templatesByCategory={templatesByCategory}
        initialValues={initial?.dynamicValues}
      />

      <div className="flex flex-wrap gap-2">
        <Button name="intent" value="draft" type="submit" variant="outline">Save Draft</Button>
        <Button name="intent" value="publish" type="submit">Publish</Button>
      </div>
    </form>
  );
}
