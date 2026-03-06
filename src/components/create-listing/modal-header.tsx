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
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
      <div className="min-w-0">
        <p className="text-base font-semibold tracking-tight sm:text-lg">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="h-9 w-9 shrink-0 rounded-full p-0"
        aria-label={closeLabel}
      >
        <X size={15} />
      </Button>
    </div>
  );
}
