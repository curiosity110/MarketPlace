"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Currency, ListingCondition } from "@prisma/client";
import { CirclePlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicFieldsEditor } from "@/components/dynamic-fields-editor";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MARKETPLACE_CURRENCIES } from "@/lib/currency";
import { DYNAMIC_FIELD_PREFIX } from "@/lib/listing-fields";
import { PHONE_COUNTRIES } from "@/lib/phone";

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

type PersistedCreateDraft = {
  categoryId: string;
  plan: ListingPlan;
  values: Record<string, string>;
};

const CREATE_FORM_STORAGE_KEY = "mkd:create-listing-form:v1";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  cities: City[];
  templatesByCategory: Record<string, Template[]>;
  allowDraft?: boolean;
  showPlanSelector?: boolean;
  publishLabel?: string;
  paymentProvider?: "none" | "stripe-dummy";
  initial?: {
    id?: string;
    title?: string;
    description?: string;
    price?: number;
    currency?: Currency;
    condition?: ListingCondition;
    categoryId?: string;
    cityId?: string;
    phone?: string;
    phoneCountry?: string;
    dynamicValues?: Record<string, string>;
    plan?: ListingPlan;
  };
};

export function ListingForm({
  action,
  categories,
  cities,
  templatesByCategory,
  allowDraft = true,
  showPlanSelector = true,
  publishLabel = "Publish listing",
  paymentProvider = "none",
  initial,
}: Props) {
  const isCreateMode = !initial?.id;
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoPopoverRef = useRef<HTMLDivElement | null>(null);

  const initialCategory = initial?.categoryId ?? categories[0]?.id ?? "";
  const hasSavedProfilePhone = Boolean((initial?.phone ?? "").trim());
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [phoneCountry, setPhoneCountry] = useState(initial?.phoneCountry ?? "MK");
  const [useSavedPhone, setUseSavedPhone] = useState(hasSavedProfilePhone);
  const [plan, setPlan] = useState<ListingPlan>(
    initial?.plan ?? "pay-per-listing",
  );
  const [isRestored, setIsRestored] = useState(!isCreateMode);
  const [restoredValues, setRestoredValues] = useState<Record<string, string>>({});
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [showPhotoPopover, setShowPhotoPopover] = useState(false);

  const categorySlugById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.slug])),
    [categories],
  );

  const dynamicInitialValues = useMemo(() => {
    const base = { ...(initial?.dynamicValues ?? {}) };
    if (!isCreateMode) return base;

    Object.entries(restoredValues).forEach(([key, value]) => {
      if (!key.startsWith(DYNAMIC_FIELD_PREFIX)) return;
      base[key.slice(DYNAMIC_FIELD_PREFIX.length)] = value;
    });
    return base;
  }, [initial?.dynamicValues, isCreateMode, restoredValues]);

  const restoredCondition = useMemo(() => {
    if (!isCreateMode) return initial?.condition ?? ListingCondition.USED;
    const value = restoredValues.condition as ListingCondition | undefined;
    return Object.values(ListingCondition).includes(value || ListingCondition.USED)
      ? value || ListingCondition.USED
      : ListingCondition.USED;
  }, [initial?.condition, isCreateMode, restoredValues.condition]);

  const restoredCityId = useMemo(() => {
    if (!isCreateMode) return initial?.cityId ?? cities[0]?.id;
    const value = restoredValues.cityId;
    if (value && cities.some((city) => city.id === value)) return value;
    return initial?.cityId ?? cities[0]?.id;
  }, [cities, initial?.cityId, isCreateMode, restoredValues.cityId]);

  const restoredCurrency = useMemo(() => {
    if (!isCreateMode) return initial?.currency ?? Currency.MKD;
    const value = restoredValues.currency as Currency | undefined;
    if (value === Currency.MKD || value === Currency.EUR) return value;
    return initial?.currency ?? Currency.MKD;
  }, [initial?.currency, isCreateMode, restoredValues.currency]);

  const readValue = useCallback(
    (key: string, fallback = "") => {
      if (isCreateMode && key in restoredValues) return restoredValues[key];
      return fallback;
    },
    [isCreateMode, restoredValues],
  );

  const persistDraft = useCallback(() => {
    if (!isCreateMode || !formRef.current || typeof window === "undefined") return;

    const formData = new FormData(formRef.current);
    const values: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      if (key === "photo" || key === "intent" || key === "id") continue;
      if (typeof value === "string") values[key] = value;
    }

    values.categoryId = categoryId;
    values.plan = plan;

    const payload: PersistedCreateDraft = {
      categoryId,
      plan,
      values,
    };

    window.localStorage.setItem(CREATE_FORM_STORAGE_KEY, JSON.stringify(payload));
  }, [categoryId, isCreateMode, plan]);

  useEffect(() => {
    if (!isCreateMode || typeof window === "undefined") return;

    const raw = window.localStorage.getItem(CREATE_FORM_STORAGE_KEY);
    if (!raw) {
      setIsRestored(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedCreateDraft;
      const nextValues = parsed?.values ?? {};
      setRestoredValues(nextValues);

      const nextCategory =
        parsed.categoryId || nextValues.categoryId || initial?.categoryId;
      if (nextCategory && categories.some((category) => category.id === nextCategory)) {
        setCategoryId(nextCategory);
      }

      if (parsed.plan === "subscription" || parsed.plan === "pay-per-listing") {
        setPlan(parsed.plan);
      }

      const parsedCountry = parsed.values?.phoneCountry;
      if (parsedCountry && PHONE_COUNTRIES.some((country) => country.code === parsedCountry)) {
        setPhoneCountry(parsedCountry);
      }

      if (hasSavedProfilePhone && parsed.values?.useSavedPhone === "false") {
        setUseSavedPhone(false);
      }
    } catch {
      window.localStorage.removeItem(CREATE_FORM_STORAGE_KEY);
    } finally {
      setIsRestored(true);
    }
  }, [categories, hasSavedProfilePhone, initial?.categoryId, isCreateMode]);

  useEffect(() => {
    if (!isCreateMode || !isRestored) return;
    persistDraft();
  }, [categoryId, isCreateMode, isRestored, persistDraft, phoneCountry, plan]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    if (!showPhotoPopover) return;

    function handleDocumentClick(event: MouseEvent) {
      if (!photoPopoverRef.current) return;
      if (!photoPopoverRef.current.contains(event.target as Node)) {
        setShowPhotoPopover(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [showPhotoPopover]);

  function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
      setPhotoName("");
      setShowPhotoPopover(false);
      return;
    }

    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    const nextPreview = URL.createObjectURL(nextFile);
    setPhotoPreviewUrl(nextPreview);
    setPhotoName(nextFile.name);
  }

  if (!isRestored) {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
        Restoring your saved listing draft...
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      encType={!initial?.id ? "multipart/form-data" : undefined}
      className="space-y-5"
      onChange={() => {
        if (isCreateMode) persistDraft();
      }}
      onSubmit={() => {
        if (isCreateMode) persistDraft();
      }}
    >
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="plan" value={plan} />
      {paymentProvider !== "none" && (
        <input type="hidden" name="paymentProvider" value={paymentProvider} />
      )}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <h3 className="text-lg font-semibold">Listing details</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 sm:col-span-3">
              <span className="text-sm font-medium">Title</span>
              <Input
                name="title"
                defaultValue={readValue("title", initial?.title ?? "")}
                placeholder="Example: Volkswagen Golf 7 2017"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Price</span>
              <Input
                type="number"
                step="1"
                min="0"
                name="price"
                defaultValue={readValue("price", String(initial?.price ?? 0))}
                placeholder="Price"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Currency</span>
              <Select name="currency" defaultValue={restoredCurrency}>
                {MARKETPLACE_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Condition</span>
              <Select
                name="condition"
                defaultValue={restoredCondition}
              >
                {Object.values(ListingCondition).map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1 sm:col-span-3">
              <span className="text-sm font-medium">Description</span>
              <textarea
                name="description"
                defaultValue={readValue("description", initial?.description ?? "")}
                className="min-h-32 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Describe condition, features, delivery, and payment terms."
              />
            </label>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <h3 className="text-lg font-semibold">Category and location</h3>

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
          </label>

          <div>
            <Link
              href="/sell/analytics"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CirclePlus size={13} />
              Request new category in dashboard
            </Link>
          </div>

          <label className="space-y-1">
            <span className="text-sm font-medium">City</span>
            <Select name="cityId" defaultValue={restoredCityId} required>
              {cities.length === 0 ? (
                <option value="" disabled>
                  No city available
                </option>
              ) : (
                cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))
              )}
            </Select>
          </label>

          <div className="space-y-2 rounded-xl border border-border/70 bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Seller phone for all posts</p>
              {hasSavedProfilePhone && (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={() => setUseSavedPhone((prev) => !prev)}
                >
                  {useSavedPhone ? "Use different phone for this post" : "Use saved phone"}
                </button>
              )}
            </div>
            <input type="hidden" name="useSavedPhone" value={String(useSavedPhone)} />

            {hasSavedProfilePhone && useSavedPhone ? (
              <>
                <input
                  type="hidden"
                  name="phoneCountry"
                  value={initial?.phoneCountry ?? phoneCountry}
                />
                <input type="hidden" name="phone" value={initial?.phone ?? ""} />
                <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Using your saved seller phone automatically on this post.
                  </p>
                  <p className="text-sm font-semibold">
                    {initial?.phoneCountry || "MK"} {initial?.phone}
                  </p>
                </div>
              </>
            ) : (
              <div className="grid gap-2 sm:grid-cols-[170px_1fr]">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Country</span>
                  <Select
                    name="phoneCountry"
                    value={phoneCountry}
                    onChange={(event) => setPhoneCountry(event.target.value)}
                  >
                    {PHONE_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.label} (+{country.dialCode})
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Phone</span>
                  <Input
                    name="phone"
                    defaultValue={readValue("phone", initial?.phone ?? "")}
                    placeholder="Enter phone number"
                  />
                </label>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Use local format, +country prefix, or 00country prefix.
            </p>
          </div>

          {!initial?.id && (
            <div className="space-y-2 rounded-xl border border-border/70 bg-card p-3">
              <p className="text-sm font-medium">Photo (optional)</p>
              <input
                ref={fileInputRef}
                name="photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPhotoChange}
              />
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-xl border border-border/70 bg-muted/30">
                  {photoPreviewUrl ? (
                    <Image
                      src={photoPreviewUrl}
                      alt="Selected listing photo preview"
                      width={56}
                      height={56}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose photo
                    </Button>
                    <div ref={photoPopoverRef} className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={!photoPreviewUrl}
                        onClick={() => setShowPhotoPopover((prev) => !prev)}
                      >
                        Preview pop
                      </Button>
                      {showPhotoPopover && photoPreviewUrl && (
                        <div className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-border/80 bg-card p-2 shadow-lg">
                          <Image
                            src={photoPreviewUrl}
                            alt="Popup preview"
                            width={220}
                            height={220}
                            unoptimized
                            className="h-44 w-full rounded-lg object-cover"
                          />
                          <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            {photoName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {photoName || "No file selected"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Add one photo now (JPG, PNG, WEBP up to 6MB).
              </p>
              <p className="text-xs text-muted-foreground">
                Form auto-saves and restores after refresh on this device.
              </p>
            </div>
          )}
        </div>
      </section>

      {showPlanSelector && (
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
      )}

      <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
        <h3 className="text-lg font-semibold">Category fields</h3>
        <DynamicFieldsEditor
          key={categoryId}
          categoryId={categoryId}
          categorySlugById={categorySlugById}
          templatesByCategory={templatesByCategory}
          initialValues={dynamicInitialValues}
        />
      </section>

      <div className="flex flex-wrap gap-2 pt-1">
        {allowDraft && (
          <Button name="intent" value="draft" type="submit" variant="outline">
            Save draft
          </Button>
        )}
        <Button name="intent" value="publish" type="submit">
          {publishLabel}
        </Button>
      </div>
      {isCreateMode && showPlanSelector && paymentProvider === "stripe-dummy" && (
        <p className="text-xs text-muted-foreground">
          Stripe dummy payment is simulated before activation.
        </p>
      )}
    </form>
  );
}
