import type React from "react";
import { cn } from "@/lib/utils";

type StickyActionBarProps = React.HTMLAttributes<HTMLDivElement> & {
  leading?: React.ReactNode;
  trailing: React.ReactNode;
};

export function StickyActionBar({
  leading,
  trailing,
  className,
  ...props
}: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-3 border-t border-border/40 bg-background/96 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-2 sm:order-1">{leading}</div>
        <div className="order-1 flex flex-col gap-2 sm:order-2 sm:flex-row sm:items-center">
          {trailing}
        </div>
      </div>
    </div>
  );
}
