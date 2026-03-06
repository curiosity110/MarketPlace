import type React from "react";
import { cn } from "@/lib/utils";
import { uiTypography } from "@/components/ui/ui-patterns";

type EmptyStateProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full rounded-2xl border border-border/70 bg-card px-4 py-8 text-center sm:px-6 sm:py-10",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg min-w-0 flex-col items-center gap-2">
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
        <h2 className={uiTypography.sectionTitle}>{title}</h2>
        {description ? (
          <p className={uiTypography.muted}>{description}</p>
        ) : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </section>
  );
}
