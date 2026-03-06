import type React from "react";
import { cn } from "@/lib/utils";
import { SectionBlock } from "@/components/ui/layout/section-block";

type FormBlockProps = React.ComponentProps<typeof SectionBlock>;

export function FormBlock({ className, ...props }: FormBlockProps) {
  return <SectionBlock className={cn("space-y-4", className)} {...props} />;
}
