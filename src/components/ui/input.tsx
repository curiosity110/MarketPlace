import type React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200",
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
        "hover:border-border/80",
        className,
      )}
      {...props}
    />
  );
}
