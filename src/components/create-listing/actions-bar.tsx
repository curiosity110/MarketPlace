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
    <div className="sticky bottom-0 z-10 -mx-3 border-t border-border/40 bg-background/96 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {allowDraft ? (
          <div className="order-2 sm:order-1">
            <Button
              name="intent"
              value="draft"
              type="submit"
              variant="ghost"
              disabled={isActionBusy}
              className="w-full justify-center text-muted-foreground sm:w-auto"
            >
              {saveDraftLabel}
            </Button>
          </div>
        ) : <div className="hidden sm:block" />}

        <div className="order-1 flex flex-col gap-2 sm:order-2 sm:flex-row sm:items-center">
        {requiresDummyPayment ? (
          <Button
            type="button"
            onClick={onOpenPaymentPanel}
            disabled={isActionBusy}
            className="w-full sm:min-w-[200px]"
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
            className="w-full sm:min-w-[200px]"
          >
            {isActionBusy ? publishingLabel : publishLabel}
          </Button>
        )}
        </div>
      </div>
    </div>
  );
}
