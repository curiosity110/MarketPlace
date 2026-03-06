import type React from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: "narrow" | "default" | "wide";
};

const sizeClassMap: Record<NonNullable<PageContainerProps["size"]>, string> = {
  narrow: "max-w-4xl",
  default: "max-w-6xl",
  wide: "max-w-[72rem]",
};

export function PageContainer({
  size = "default",
  className,
  ...props
}: PageContainerProps) {
  // Page-level layout primitive: controls max width only; pages own content structure.
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-full overflow-x-hidden",
        sizeClassMap[size],
        className,
      )}
      {...props}
    />
  );
}
