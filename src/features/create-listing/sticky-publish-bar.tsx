"use client";

type Props = {
  backLabel: string;
  primaryLabel: string;
  canGoBack: boolean;
  isBusy: boolean;
  onBack: () => void;
};

export function StickyPublishBar({
  backLabel,
  primaryLabel,
  canGoBack,
  isBusy,
  onBack,
}: Props) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-border/35 bg-background/95 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between gap-3">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={isBusy}
            className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {backLabel}
          </button>
        ) : (
          <div />
        )}

        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex min-w-[11rem] items-center justify-center rounded-full bg-[#2e241d] px-6 py-3.5 text-sm font-semibold text-[#f8f1e7] transition-opacity hover:opacity-92 disabled:opacity-50"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
