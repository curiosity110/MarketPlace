import type React from "react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/ui/layout/page-container";

type PageShellProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: "narrow" | "default" | "wide";
};

export function PageShell({
  size = "default",
  className,
  children,
  ...props
}: PageShellProps) {
  return (
    <PageContainer
      size={size}
      className={cn(
        "space-y-4 px-0 pb-4 pt-1 sm:space-y-8 sm:pb-10 sm:pt-2",
        className,
      )}
      {...props}
    >
      {children}
    </PageContainer>
  );
}
