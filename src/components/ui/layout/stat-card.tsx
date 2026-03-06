import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { uiTypography } from "@/components/ui/ui-patterns";

type StatTone = "default" | "success" | "warning" | "secondary";

type StatCardProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: StatTone;
  className?: string;
  valueClassName?: string;
};

const toneClassMap: Record<StatTone, string> = {
  default: "bg-muted/70 text-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  secondary: "bg-secondary/10 text-secondary",
};

export function StatCard({
  label,
  value,
  description,
  icon,
  tone = "default",
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className={cn("rounded-2xl shadow-none ring-1 ring-black/5 dark:ring-white/10", className)}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className={uiTypography.eyebrow}>
            {label}
          </p>
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
        <p className={cn("text-3xl font-black leading-none", valueClassName)}>
          {value}
        </p>
        {description ? (
          <p className={uiTypography.muted}>{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
