import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type BrowseSearchAssistChip = {
  key: string;
  label: string;
  tone?: "primary" | "default";
  onSelect: () => void;
};

type Props = {
  title: string;
  chips: BrowseSearchAssistChip[];
  compact?: boolean;
};

export function BrowseSearchAssist({ title, chips, compact = false }: Props) {
  if (chips.length === 0) return null;

  return (
    <div className="rounded-[1.15rem] border border-border/45 bg-card/72 p-2.5 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.18)] backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-1.5 px-0.5">
        <Sparkles size={13} className="text-primary/85" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </p>
      </div>

      <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onSelect}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition-colors",
              chip.tone === "primary"
                ? "bg-foreground text-background shadow-[0_10px_18px_-18px_rgba(15,23,42,0.32)]"
                : "bg-muted/36 text-foreground/82 ring-1 ring-black/5 hover:bg-muted/56 dark:ring-white/10",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
