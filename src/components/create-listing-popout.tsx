"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { PlusCircle, X } from "lucide-react";
import { Currency, ListingCondition } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ListingForm } from "@/components/listing-form";

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
  allowDraft?: boolean;
  showPlanSelector?: boolean;
  publishLabel?: string;
  paymentProvider?: "none" | "stripe-dummy";
  mode?: "card" | "button";
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  buttonSize?: "sm" | "md" | "lg";
  buttonClassName?: string;
  openOnMount?: boolean;
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

export function CreateListingPopout({
  action,
  categories,
  cities,
  templatesByCategory,
  allowDraft = true,
  showPlanSelector = true,
  publishLabel = "Publish listing",
  paymentProvider = "none",
  mode = "card",
  buttonLabel = "New listing",
  buttonVariant = "default",
  buttonSize = "md",
  buttonClassName = "",
  openOnMount = false,
  initial,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const autoOpenDoneRef = useRef(false);

  function openPopout() {
    setIsOpen(true);
    requestAnimationFrame(() => setIsActive(true));
  }

  function closePopout() {
    setIsActive(false);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 190);
  }

  useEffect(() => {
    if (!openOnMount || autoOpenDoneRef.current) return;
    autoOpenDoneRef.current = true;
    const timer = window.setTimeout(() => openPopout(), 0);
    return () => window.clearTimeout(timer);
  }, [openOnMount]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopout();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <>
      {mode === "card" ? (
        <CardLike>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-bold">Create listing</p>
              <p className="text-sm text-muted-foreground">
                Open the form only when you need it.
              </p>
            </div>
            <Button type="button" onClick={openPopout} className="gap-2">
              <PlusCircle size={16} />
              {buttonLabel}
            </Button>
          </div>
        </CardLike>
      ) : (
        <Button
          type="button"
          onClick={openPopout}
          variant={buttonVariant}
          size={buttonSize}
          className={`gap-2 ${buttonClassName}`}
        >
          <PlusCircle size={16} />
          {buttonLabel}
        </Button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close create listing form"
            onClick={closePopout}
            className={`absolute inset-0 bg-black/45 transition-opacity duration-200 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />

          <div
            className={`relative mx-auto flex h-full max-h-[86vh] w-full max-w-[980px] flex-col rounded-2xl border border-border bg-background shadow-2xl transition-all duration-200 ${
              isActive
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-2 scale-[0.99] opacity-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-6">
              <div>
                <p className="text-xl font-black">Create a new listing</p>
                <p className="text-sm text-muted-foreground">
                  Fill details and publish when ready.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={closePopout} className="gap-1">
                <X size={15} />
                Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <ListingForm
                action={action}
                categories={categories}
                cities={cities}
                templatesByCategory={templatesByCategory}
                allowDraft={allowDraft}
                showPlanSelector={showPlanSelector}
                publishLabel={publishLabel}
                paymentProvider={paymentProvider}
                initial={initial}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CardLike({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-4">
      {children}
    </div>
  );
}
