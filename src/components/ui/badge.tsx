import type React from "react";
import { cn } from "@/lib/utils";
import { uiTypography } from "@/components/ui/ui-patterns";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "destructive";
}

const variantStyles = {
  default: "border-border/60 bg-muted/70 text-muted-foreground",
  primary:
    "border-orange-200/80 dark:border-orange-700/70 bg-orange-50/80 dark:bg-orange-950/25 text-orange-900 dark:text-orange-200",
  secondary:
    "border-blue-200/80 dark:border-blue-700/70 bg-blue-50/80 dark:bg-blue-950/25 text-blue-900 dark:text-blue-200",
  success:
    "border-green-200/80 dark:border-green-700/70 bg-green-50/80 dark:bg-green-950/25 text-green-900 dark:text-green-200",
  warning:
    "border-yellow-200/80 dark:border-yellow-700/70 bg-yellow-50/80 dark:bg-yellow-950/25 text-yellow-900 dark:text-yellow-200",
  destructive:
    "border-red-200/80 dark:border-red-700/70 bg-red-50/80 dark:bg-red-950/25 text-red-900 dark:text-red-200",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-[0.2rem] font-medium leading-tight transition-colors",
        uiTypography.label,
        "tracking-normal text-[0.68rem]",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
