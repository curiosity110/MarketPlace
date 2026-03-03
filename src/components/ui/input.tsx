import { useId } from "react";
import type React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  id,
  name,
  autoComplete,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const resolvedId = id ?? (name ? undefined : generatedId);
  const resolvedAutoComplete = autoComplete ?? "off";

  return (
    <input
      id={resolvedId}
      name={name}
      autoComplete={resolvedAutoComplete}
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
