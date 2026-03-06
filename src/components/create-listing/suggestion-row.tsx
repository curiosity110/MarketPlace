import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  value: string;
  confidenceLabel?: string;
  applyLabel: string;
  onApply: () => void;
};

export function CreateListingSuggestionRow({
  label,
  value,
  confidenceLabel,
  applyLabel,
  onApply,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-xl border border-border/70 bg-card/90 px-3 py-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {confidenceLabel ? (
            <span className="rounded-full border border-border/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {confidenceLabel}
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm text-foreground">{value}</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={onApply}>
        {applyLabel}
      </Button>
    </div>
  );
}
