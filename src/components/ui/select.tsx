import { useId } from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { uiControls } from "@/components/ui/ui-patterns";

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
      className={cn(uiControls.selectBase, className)}
      {...props}
    />
  );
}
