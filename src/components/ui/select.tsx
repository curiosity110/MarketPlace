import type React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground transition-all duration-200 cursor-pointer",
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
        "hover:border-border/80",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}
