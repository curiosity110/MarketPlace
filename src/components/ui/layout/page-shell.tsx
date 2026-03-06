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
        "space-y-4 px-4 pb-6 pt-3 sm:space-y-5 sm:px-6 sm:pb-8 lg:px-8",
        className,
      )}
      {...props}
    >
      {children}
    </PageContainer>
  );
}
