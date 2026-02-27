import type React from "react";
import { cn } from "@/lib/utils";

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
  default: "border-border bg-muted text-muted-foreground",
  primary:
    "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200",
  secondary:
    "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200",
  success:
    "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-200",
  warning:
    "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-200",
  destructive:
    "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.8125rem] font-semibold leading-tight transition-colors",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
