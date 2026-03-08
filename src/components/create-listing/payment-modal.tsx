"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";
import { uiModal, uiTypography } from "@/components/ui/ui-patterns";

type Props = {
  show: boolean;
  isActionBusy: boolean;
  paymentAmount: number;
  paymentLabel: string;
  closePaymentPopupLabel: string;
  secureCheckoutLabel: string;
  closeLabel: string;
  cardNumberLabel: string;
  expiryLabel: string;
  cvcLabel: string;
  cardholderLabel: string;
  cardholderPlaceholder: string;
  successFailCardsLabel: string;
  cancelLabel: string;
  publishLabel: string;
  publishingLabel: string;
  cardNumberValue?: string;
  expiryValue?: string;
  cvcValue?: string;
  cardholderValue?: string;
  onCardNumberChange?: (value: string) => void;
  onExpiryChange?: (value: string) => void;
  onCvcChange?: (value: string) => void;
  onCardholderChange?: (value: string) => void;
  onClose: () => void;
  onConfirm?: () => Promise<void> | void;
};

export function CreateListingPaymentModal({
  show,
  isActionBusy,
  paymentAmount,
  paymentLabel,
  closePaymentPopupLabel,
  secureCheckoutLabel,
  closeLabel,
  cardNumberLabel,
  expiryLabel,
  cvcLabel,
  cardholderLabel,
  cardholderPlaceholder,
  successFailCardsLabel,
  cancelLabel,
  publishLabel,
  publishingLabel,
  cardNumberValue = "",
  expiryValue = "",
  cvcValue = "",
  cardholderValue = "",
  onCardNumberChange,
  onExpiryChange,
  onCvcChange,
  onCardholderChange,
  onClose,
  onConfirm,
}: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!show) {
      return;
    }

    lockBodyScroll();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isActionBusy) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unlockBodyScroll();
    };
  }, [isActionBusy, onClose, show]);

  return (
    <div
      className={`fixed inset-0 z-[95] flex items-center justify-center p-3 transition-all duration-200 ${
        show
          ? "pointer-events-auto visible opacity-100"
          : "pointer-events-none invisible opacity-0"
      }`}
      aria-hidden={!show}
    >
      <button
        type="button"
        aria-label={closePaymentPopupLabel}
        onClick={() => {
          if (isActionBusy) return;
          onClose();
        }}
        className={uiModal.backdrop}
      />

      <form
        ref={formRef}
        className="relative z-[1] w-full max-w-lg rounded-2xl bg-card p-4 shadow-[0_24px_64px_-36px_rgba(2,6,23,0.45)] ring-1 ring-black/10 sm:p-5 dark:ring-white/10"
        onSubmit={(event) => {
          event.preventDefault();
          void onConfirm?.();
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={uiTypography.eyebrow}>{secureCheckoutLabel}</p>
            <p className="text-2xl font-black">${paymentAmount}</p>
            <p className={uiTypography.muted}>{paymentLabel}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClose}
            disabled={isActionBusy}
          >
            {closeLabel}
          </Button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <label className="space-y-1 sm:col-span-3">
            <span className="text-xs font-medium text-muted-foreground">
              {cardNumberLabel}
            </span>
            <Input
              name="dummyCardNumber"
              value={cardNumberValue}
              onChange={(event) => onCardNumberChange?.(event.target.value)}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
              autoFocus={show}
              pattern="[0-9 ]{16,23}"
              required={show}
              disabled={!show || isActionBusy}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {expiryLabel}
            </span>
            <Input
              name="dummyCardExp"
              value={expiryValue}
              onChange={(event) => onExpiryChange?.(event.target.value)}
              placeholder="MM/YY"
              autoComplete="cc-exp"
              pattern="(0[1-9]|1[0-2])/[0-9]{2}"
              required={show}
              disabled={!show || isActionBusy}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {cvcLabel}
            </span>
            <Input
              name="dummyCardCvc"
              value={cvcValue}
              onChange={(event) => onCvcChange?.(event.target.value)}
              placeholder="CVC"
              inputMode="numeric"
              autoComplete="cc-csc"
              pattern="[0-9]{3,4}"
              required={show}
              disabled={!show || isActionBusy}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {cardholderLabel}
            </span>
            <Input
              name="dummyCardName"
              value={cardholderValue}
              onChange={(event) => onCardholderChange?.(event.target.value)}
              placeholder={cardholderPlaceholder}
              autoComplete="cc-name"
              minLength={2}
              maxLength={80}
              required={show}
              disabled={!show || isActionBusy}
            />
          </label>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">{successFailCardsLabel}</p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isActionBusy}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            disabled={isActionBusy}
          >
            {isActionBusy ? publishingLabel : publishLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
