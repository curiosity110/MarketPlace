import { useId } from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { uiControls } from "@/components/ui/ui-patterns";

export function Textarea({
  className,
  id,
  name,
  autoComplete,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generatedId = useId();
  const resolvedId = id ?? (name ? undefined : generatedId);
  const resolvedAutoComplete = autoComplete ?? "off";

  return (
    <textarea
      id={resolvedId}
      name={name}
      autoComplete={resolvedAutoComplete}
      className={cn(uiControls.textareaBase, className)}
      {...props}
    />
  );
}
