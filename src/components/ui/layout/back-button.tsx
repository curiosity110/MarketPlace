import type React from "react";
import { CompactBackButton } from "@/components/compact-back-button";
import { cn } from "@/lib/utils";

type BackButtonProps = React.ComponentProps<typeof CompactBackButton>;

export function BackButton({ className, ...props }: BackButtonProps) {
  return (
    <CompactBackButton
      className={cn("h-8 gap-1.5 rounded-full px-2.5 text-xs", className)}
      {...props}
    />
  );
}
