import { useId } from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { uiControls } from "@/components/ui/ui-patterns";

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
      className={cn(uiControls.inputBase, className)}
      {...props}
    />
  );
}
