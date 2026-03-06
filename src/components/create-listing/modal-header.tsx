"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  subtitle: string;
  closeLabel: string;
  onClose: () => void;
};

export function CreateListingModalHeader({
  title,
  subtitle,
  closeLabel,
  onClose,
}: Props) {
  return (
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-3">
      <div className="min-w-0">
        <p className="text-[1.05rem] font-semibold tracking-tight sm:text-lg">{title}</p>
        <p className="mt-0.5 max-w-xl text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
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
