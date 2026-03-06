import type React from "react";
import { cn } from "@/lib/utils";

type FilterToolbarProps = React.HTMLAttributes<HTMLDivElement> & {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  chips?: React.ReactNode;
};

export function FilterToolbar({
  leading,
  trailing,
  chips,
  className,
  ...props
}: FilterToolbarProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">{leading}</div>
        {trailing ? <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div> : null}
      </div>
      {chips ? <div className="min-w-0">{chips}</div> : null}
    </div>
  );
}
