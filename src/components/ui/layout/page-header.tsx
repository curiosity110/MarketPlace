import type React from "react";
import { cn } from "@/lib/utils";
import { uiTypography } from "@/components/ui/ui-patterns";

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  compact?: boolean;
};

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  titleClassName,
  subtitleClassName,
  compact = false,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full overflow-hidden",
        compact ? "py-1" : "py-1.5 sm:py-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1
            className={cn(
              "truncate",
              uiTypography.pageTitle,
              titleClassName,
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className={cn(
                "max-w-2xl",
                uiTypography.muted,
                subtitleClassName,
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </section>
  );
}
