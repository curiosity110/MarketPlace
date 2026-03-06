import type React from "react";
import { SectionBlock } from "@/components/ui/layout/section-block";

type SellerCardProps = {
  title: React.ReactNode;
  headingAction?: React.ReactNode;
  identity: React.ReactNode;
  primaryValue: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function SellerCard({
  title,
  headingAction,
  identity,
  primaryValue,
  actions,
  footer,
  className,
}: SellerCardProps) {
  return (
    <SectionBlock title={title} action={headingAction} className={className}>
      <div className="space-y-4">
        <div className="space-y-3 rounded-[1rem] bg-muted/28 p-4 ring-1 ring-black/5 dark:ring-white/10">
          <div className="text-sm font-semibold">{identity}</div>
          <div className="rounded-[0.9rem] bg-background/92 px-3 py-3 ring-1 ring-black/5 dark:ring-white/10">
            <div className="text-xl font-semibold tracking-tight">{primaryValue}</div>
          </div>
        </div>
        {actions ? <div className="space-y-2">{actions}</div> : null}
        {footer ? <div>{footer}</div> : null}
      </div>
    </SectionBlock>
  );
}
