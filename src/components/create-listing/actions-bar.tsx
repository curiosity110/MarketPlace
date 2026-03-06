import { Button } from "@/components/ui/button";

type Props = {
  allowDraft: boolean;
  requiresDummyPayment: boolean;
  isActionBusy: boolean;
  saveDraftLabel: string;
  publishingLabel: string;
  publishLabel: string;
  payAndPublishPrefix: string;
  publishSuffix: string;
  paymentAmount: number;
  onOpenPaymentPanel: () => void;
};

export function CreateListingActionsBar({
  allowDraft,
  requiresDummyPayment,
  isActionBusy,
  saveDraftLabel,
  publishingLabel,
  publishLabel,
  payAndPublishPrefix,
  publishSuffix,
  paymentAmount,
  onOpenPaymentPanel,
}: Props) {
  return (
    <div className="sticky bottom-0 z-10 -mx-3 border-t border-border/50 bg-background/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        {allowDraft && (
          <Button
            name="intent"
            value="draft"
            type="submit"
            variant="ghost"
            disabled={isActionBusy}
            className="w-full text-muted-foreground sm:w-auto"
          >
            {saveDraftLabel}
          </Button>
        )}
        {requiresDummyPayment ? (
          <Button
            type="button"
            onClick={onOpenPaymentPanel}
            disabled={isActionBusy}
            className="w-full sm:min-w-[180px] sm:w-auto"
          >
            {isActionBusy
              ? publishingLabel
              : `${payAndPublishPrefix}${paymentAmount}${publishSuffix}`}
          </Button>
        ) : (
          <Button
            name="intent"
            value="publish"
            type="submit"
            disabled={isActionBusy}
            className="w-full sm:min-w-[180px] sm:w-auto"
          >
            {isActionBusy ? publishingLabel : publishLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
