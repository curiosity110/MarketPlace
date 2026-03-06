import type React from "react";
import { cn } from "@/lib/utils";
import { uiTypography } from "@/components/ui/ui-patterns";

type FormSectionProps = React.HTMLAttributes<HTMLElement> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

export function FormSection({
  title,
  description,
  action,
  className,
  children,
  ...props
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full space-y-4 rounded-2xl border border-border/70 bg-card p-4 sm:p-6",
        className,
      )}
      {...props}
    >
      {title || description || action ? (
        <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {title ? <h2 className={uiTypography.cardTitle}>{title}</h2> : null}
            {description ? (
              <p className={uiTypography.muted}>{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
