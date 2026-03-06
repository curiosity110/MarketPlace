import type React from "react";
import { cn } from "@/lib/utils";
import { uiTypography } from "@/components/ui/ui-patterns";

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  contentClassName?: string;
};

export function Section({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full rounded-[1.35rem] bg-card/80 p-4 ring-1 ring-black/5 sm:p-5 dark:ring-white/10",
        className,
      )}
      {...props}
    >
      {title || description || action ? (
        <header className="mb-3 flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {title ? <h2 className={uiTypography.sectionTitle}>{title}</h2> : null}
            {description ? (
              <p className={uiTypography.muted}>{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("min-w-0 max-w-full", contentClassName)}>{children}</div>
    </section>
  );
}
