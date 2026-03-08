import type React from "react";
import { cn } from "@/lib/utils";
import { uiTypography } from "@/components/ui/ui-patterns";

type StatTone = "default" | "success" | "warning" | "secondary";

type StatItemProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: StatTone;
  className?: string;
  valueClassName?: string;
};

const toneClassMap: Record<StatTone, string> = {
  default: "bg-background/80 text-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  secondary: "bg-secondary/10 text-secondary",
};

export function StatItem({
  label,
  value,
  description,
  icon,
  tone = "default",
  className,
  valueClassName,
}: StatItemProps) {
  return (
    <div
      className={cn(
        "rounded-[1.55rem] bg-card/75 px-4 py-4 ring-1 ring-black/4 dark:ring-white/10",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className={uiTypography.eyebrow}>{label}</p>
          <p className={cn("text-xl font-semibold tracking-tight sm:text-2xl", valueClassName)}>
            {value}
          </p>
        </div>
        {icon ? (
          <span
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              toneClassMap[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
