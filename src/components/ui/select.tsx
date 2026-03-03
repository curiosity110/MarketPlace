import { useId } from "react";
import type React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  id,
  name,
  autoComplete,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const generatedId = useId();
  const resolvedId = id ?? (name ? undefined : generatedId);
  const resolvedAutoComplete = autoComplete ?? "off";

  return (
    <select
      id={resolvedId}
      name={name}
      autoComplete={resolvedAutoComplete}
      className={cn(
        "h-10 w-full cursor-pointer rounded-xl border border-border bg-input px-3 text-sm text-foreground",
        "transition-colors duration-150 hover:border-primary/25",
        "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}
