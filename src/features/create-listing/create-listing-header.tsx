"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
};

export function CreateListingHeader({
  title,
  subtitle,
  closeLabel,
  onClose,
}: Props) {
  return (
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/40 bg-background/96 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="min-w-0 space-y-1">
        <p className="text-lg font-semibold tracking-tight sm:text-xl">{title}</p>
        {subtitle ? <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={onClose}
        className="h-9 w-9 shrink-0 rounded-full p-0"
        aria-label={closeLabel}
      >
        <X size={15} />
      </Button>
    </div>
  );
}
