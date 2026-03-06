import type React from "react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  // Shared app shell width + horizontal overflow guard for route content.
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-4 sm:px-5 lg:px-6",
        className,
      )}
      {...props}
    />
  );
}
