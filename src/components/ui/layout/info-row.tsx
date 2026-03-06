import type React from "react";
import { cn } from "@/lib/utils";
import { uiTypography } from "@/components/ui/ui-patterns";

type InfoRowProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function InfoRow({
  label,
  value,
  icon,
  className,
  labelClassName,
  valueClassName,
}: InfoRowProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full items-start justify-between gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "inline-flex min-w-0 items-center gap-1.5",
          uiTypography.eyebrow,
          labelClassName,
        )}
      >
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "min-w-0 max-w-[70%] break-words text-right text-sm font-semibold [overflow-wrap:anywhere]",
          valueClassName,
        )}
      >
        {value}
      </div>
    </div>
  );
}
