import type React from "react";
import { cn } from "@/lib/utils";
import { uiTypography } from "@/components/ui/ui-patterns";

type SectionBlockProps = Omit<React.HTMLAttributes<HTMLElement>, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  contentClassName?: string;
};

export function SectionBlock({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
  ...props
}: SectionBlockProps) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full rounded-[1.8rem] market-surface p-5 shadow-none ring-1 ring-black/4 sm:p-6 dark:ring-white/10",
        className,
      )}
      {...props}
    >
      {title || description || action ? (
        <header className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title ? <h2 className={uiTypography.sectionTitle}>{title}</h2> : null}
            {description ? <p className={uiTypography.muted}>{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("min-w-0 max-w-full", contentClassName)}>{children}</div>
    </section>
  );
}
