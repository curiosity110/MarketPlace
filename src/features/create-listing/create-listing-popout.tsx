"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Currency, ListingCondition } from "@prisma/client";
import { Button } from "@/components/ui/button";
import type {
  CreateListingCategory,
  CreateListingCity as City,
  CreateListingPlan as ListingPlan,
  CreateListingTemplate as Template,
} from "@/components/create-listing/types";
import { uiSurface } from "@/components/ui/ui-patterns";
import { CreateListingModal } from "@/features/create-listing/create-listing-modal";
import { getCreateListingModalText } from "@/features/create-listing/utils";

type Category = CreateListingCategory & { [key: string]: unknown };

type Props = {
  action: (formData: FormData) => Promise<unknown> | unknown;
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
  hideTrigger?: boolean;
  openOnMount?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
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
  locale?: "en" | "mk";
  serverError?: string | null;
  serverErrorField?: string | null;
};

export function CreateListingPopout({
  action,
  categories,
  cities,
  templatesByCategory,
  allowDraft = true,
  showPlanSelector = true,
  publishLabel,
  paymentProvider = "none",
  mode = "card",
  buttonLabel,
  buttonVariant = "default",
  buttonSize = "md",
  buttonClassName = "",
  hideTrigger = false,
  openOnMount = false,
  open,
  onOpenChange,
  onClose,
  initial,
  locale = "en",
  serverError,
  serverErrorField,
}: Props) {
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const queryErrorField = searchParams.get("errorField");
  const queryDefaultsSaved = searchParams.get("defaultsSaved") === "1";
  const resolvedServerError = serverError ?? queryError;
  const resolvedServerErrorField = serverErrorField ?? queryErrorField;
  const text = getCreateListingModalText(locale);
  const resolvedButtonLabel = buttonLabel ?? "New listing";
  const resolvedPublishLabel = publishLabel ?? "Publish listing";
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpenControlled = typeof open === "boolean";
  const isOpen = isOpenControlled ? open : internalOpen;
  const [isActive, setIsActive] = useState(false);
  const previousIsOpenRef = useRef(isOpen);
  const isClosingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const autoOpenDoneRef = useRef(false);

  const setOpenState = useCallback(
    (nextOpen: boolean) => {
      if (!isOpenControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isOpenControlled, onOpenChange],
  );

  const openPopout = useCallback(() => {
    isClosingRef.current = false;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenState(true);
    requestAnimationFrame(() => setIsActive(true));
  }, [setOpenState]);

  const closePopout = useCallback(() => {
    isClosingRef.current = true;
    setIsActive(false);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setOpenState(false);
      isClosingRef.current = false;
      closeTimerRef.current = null;
      onClose?.();
    }, 190);
  }, [onClose, setOpenState]);

  useEffect(() => {
    if (!openOnMount || autoOpenDoneRef.current) return;
    autoOpenDoneRef.current = true;
    const timer = window.setTimeout(() => openPopout(), 0);
    return () => window.clearTimeout(timer);
  }, [openOnMount, openPopout]);

  useEffect(() => {
    const wasOpen = previousIsOpenRef.current;
    if (!wasOpen && isOpen && !isClosingRef.current) {
      const frame = window.requestAnimationFrame(() => setIsActive(true));
      previousIsOpenRef.current = isOpen;
      return () => window.cancelAnimationFrame(frame);
    }
    if (wasOpen && !isOpen) {
      isClosingRef.current = false;
      const frame = window.requestAnimationFrame(() => setIsActive(false));
      previousIsOpenRef.current = isOpen;
      return () => window.cancelAnimationFrame(frame);
    }
    previousIsOpenRef.current = isOpen;
  }, [isOpen]);

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
  }, [closePopout, isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <>
      {mode === "card" ? (
        !hideTrigger && (
          <CardLike>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold">{text.createListing}</p>
                <p className="text-sm text-muted-foreground">{text.openWhenNeeded}</p>
              </div>
              <Button type="button" onClick={openPopout} className="gap-2">
                <PlusCircle size={16} />
                {resolvedButtonLabel}
              </Button>
            </div>
          </CardLike>
        )
      ) : (
        !hideTrigger && (
          <Button
            type="button"
            onClick={openPopout}
            variant={buttonVariant}
            size={buttonSize}
            className={`gap-2 ${buttonClassName}`}
          >
            <PlusCircle size={16} />
            {resolvedButtonLabel}
          </Button>
        )
      )}

      <CreateListingModal
        isOpen={isOpen}
        isActive={isActive}
        onClose={closePopout}
        action={action}
        categories={categories}
        cities={cities}
        templatesByCategory={templatesByCategory}
        allowDraft={allowDraft}
        showPlanSelector={showPlanSelector}
        publishLabel={resolvedPublishLabel}
        paymentProvider={paymentProvider}
        initial={initial}
        locale={locale}
        serverError={resolvedServerError}
        serverErrorField={resolvedServerErrorField}
        defaultsSaved={queryDefaultsSaved}
      />
    </>
  );
}

function CardLike({ children }: { children: ReactNode }) {
  return <div className={`${uiSurface.cardStrong} p-4`}>{children}</div>;
}
