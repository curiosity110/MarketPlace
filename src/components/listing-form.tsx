"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ListingCondition } from "@prisma/client";
import { CirclePlus, Sparkles } from "lucide-react";
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

type ListingPlan = "pay-per-listing" | "subscription";

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
    plan?: ListingPlan;
  };
};

export function ListingForm({
  action,
  categories,
  cities,
  templatesByCategory,
  initial,
}: Props) {
  const initialCategory = initial?.categoryId ?? categories[0]?.id ?? "";
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [plan, setPlan] = useState<ListingPlan>(
    initial?.plan ?? "pay-per-listing",
  );

  const categorySlugById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.slug])),
    [categories],
  );

  return (
    <form action={action} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="plan" value={plan} />

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Listing basics</h3>
        <div className="grid gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium">Title</span>
            <Input
              name="title"
              defaultValue={initial?.title}
              placeholder="Example: Volkswagen Golf 7 2017"
              required
              minLength={5}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Description</span>
            <textarea
              name="description"
              defaultValue={initial?.description}
              className="min-h-32 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="Describe condition, features, delivery, and payment terms."
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Price</span>
            <Input
              type="number"
              step="1"
              min="0"
              name="price"
              defaultValue={initial?.price ?? 0}
              placeholder="Price"
              required
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Placement</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium">Condition</span>
            <Select
              name="condition"
              defaultValue={initial?.condition ?? ListingCondition.USED}
            >
              {Object.values(ListingCondition).map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Category</span>
            <Select
              name="categoryId"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Link
              href="#category-request"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CirclePlus size={13} />
              Request new category
            </Link>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">City</span>
            <Select name="cityId" defaultValue={initial?.cityId ?? cities[0]?.id}>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Seller package</h3>
          <span className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary">
            <Sparkles size={13} />
            GPT included
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setPlan("pay-per-listing")}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              plan === "pay-per-listing"
                ? "border-primary bg-orange-50/70 dark:bg-orange-500/10"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <p className="text-sm font-semibold">Pay per listing</p>
            <p className="text-2xl font-black text-primary">$4</p>
            <p className="text-xs text-muted-foreground">30 days active</p>
          </button>

          <button
            type="button"
            onClick={() => setPlan("subscription")}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              plan === "subscription"
                ? "border-secondary bg-blue-50/70 dark:bg-blue-500/10"
                : "border-border bg-card hover:border-secondary/30"
            }`}
          >
            <p className="text-sm font-semibold">Subscription</p>
            <p className="text-2xl font-black text-secondary">$30</p>
            <p className="text-xs text-muted-foreground">
              monthly, unlimited listings
            </p>
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Category fields</h3>
        <DynamicFieldsEditor
          key={categoryId}
          categoryId={categoryId}
          categorySlugById={categorySlugById}
          templatesByCategory={templatesByCategory}
          initialValues={initial?.dynamicValues}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <Button name="intent" value="draft" type="submit" variant="outline">
          Save draft
        </Button>
        <Button name="intent" value="publish" type="submit">
          Publish listing
        </Button>
      </div>
    </form>
  );
}
