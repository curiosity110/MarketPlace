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
    <div className="sticky bottom-0 z-20 border-t border-border/30 bg-background/95 px-4 py-3 shadow-[0_-18px_36px_-34px_rgba(15,23,42,0.28)] backdrop-blur-xl [padding-bottom:calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-6">
      <div className="flex items-center justify-between gap-2">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={isBusy}
            className="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-[0.95rem] font-medium text-[#6f645a] transition-colors hover:text-foreground disabled:opacity-50"
          >
            {backLabel}
          </button>
        ) : (
          <div className="hidden sm:block" />
        )}

        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex min-h-[3.25rem] flex-1 items-center justify-center rounded-full bg-[#2e241d] px-6 py-3 text-[0.98rem] font-semibold text-[#f8f1e7] transition-opacity hover:opacity-92 disabled:opacity-50 sm:min-w-[12rem] sm:flex-none"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
