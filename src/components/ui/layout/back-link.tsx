import type React from "react";
import { CompactBackButton } from "@/components/compact-back-button";
import { cn } from "@/lib/utils";

type BackLinkProps = React.ComponentProps<typeof CompactBackButton>;

export function BackLink({ className, ...props }: BackLinkProps) {
  return (
    <CompactBackButton
      className={cn(
        "h-8 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
