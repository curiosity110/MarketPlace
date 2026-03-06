import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onClose: () => void;
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
  onClose,
}: Props) {
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
        onClick={onClose}
        className={uiModal.backdrop}
      />

      <div className="relative z-[1] w-full max-w-lg rounded-2xl bg-card p-4 shadow-[0_24px_64px_-36px_rgba(2,6,23,0.45)] ring-1 ring-black/10 sm:p-5 dark:ring-white/10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={uiTypography.eyebrow}>
              {secureCheckoutLabel}
            </p>
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
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
              pattern="[0-9 ]{16,23}"
              required={show}
              disabled={!show}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {expiryLabel}
            </span>
            <Input
              name="dummyCardExp"
              placeholder="MM/YY"
              autoComplete="cc-exp"
              pattern="(0[1-9]|1[0-2])/[0-9]{2}"
              required={show}
              disabled={!show}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {cvcLabel}
            </span>
            <Input
              name="dummyCardCvc"
              placeholder="CVC"
              inputMode="numeric"
              autoComplete="cc-csc"
              pattern="[0-9]{3,4}"
              required={show}
              disabled={!show}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {cardholderLabel}
            </span>
            <Input
              name="dummyCardName"
              placeholder={cardholderPlaceholder}
              autoComplete="cc-name"
              minLength={2}
              maxLength={80}
              required={show}
              disabled={!show}
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
          <Button name="intent" value="publish" type="submit" disabled={isActionBusy}>
            {isActionBusy ? publishingLabel : publishLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
