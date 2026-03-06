import type React from "react";
import { cn } from "@/lib/utils";

type ListingCardBaseProps = {
  media: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  mediaClassName?: string;
  footerClassName?: string;
};

export function ListingCardBase({
  media,
  body,
  footer,
  className,
  bodyClassName,
  mediaClassName,
  footerClassName,
}: ListingCardBaseProps) {
  return (
    <article
      className={cn(
        "group h-full min-w-0 overflow-hidden rounded-[1.35rem] border border-border/60 bg-card shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-[0_22px_46px_-34px_rgba(15,23,42,0.35)]",
        className,
      )}
    >
      <div className={cn("overflow-hidden", mediaClassName)}>{media}</div>
      <div className={cn("space-y-3 p-3.5 sm:p-4", bodyClassName)}>{body}</div>
      {footer ? (
        <div
          className={cn(
            "border-t border-border/50 px-3.5 py-2.5 text-[0.72rem] text-muted-foreground sm:px-4",
            footerClassName,
          )}
        >
          {footer}
        </div>
      ) : null}
    </article>
  );
}
