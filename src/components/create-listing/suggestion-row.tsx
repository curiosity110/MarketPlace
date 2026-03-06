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
    <div className="flex items-start justify-between gap-2 rounded-xl bg-background/80 px-3 py-2 ring-1 ring-black/5 dark:ring-white/10">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {confidenceLabel ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {confidenceLabel}
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm text-foreground">{value}</p>
      </div>
      <Button type="button" size="sm" variant="ghost" onClick={onApply}>
        {applyLabel}
      </Button>
    </div>
  );
}
