import type React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground",
        "transition-colors duration-150 hover:border-primary/25",
        "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15",
        className,
      )}
      {...props}
    />
  );
}
