import { Button } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/layout";

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

export function CreateListingModalActionBar({
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
    <StickyActionBar
      leading={
        allowDraft ? (
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
        ) : null
      }
      trailing={
        requiresDummyPayment ? (
          <Button
            type="button"
            onClick={onOpenPaymentPanel}
            disabled={isActionBusy}
            className="w-full sm:min-w-[220px]"
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
            className="w-full sm:min-w-[220px]"
          >
            {isActionBusy ? publishingLabel : publishLabel}
          </Button>
        )
      }
    />
  );
}
