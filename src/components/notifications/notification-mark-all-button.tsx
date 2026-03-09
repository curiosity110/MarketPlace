"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  pending: boolean;
  disabled: boolean;
  compact?: boolean;
  onClick: () => void;
};

export function NotificationMarkAllButton({
  label,
  pending,
  disabled,
  compact = false,
  onClick,
}: Props) {
  return (
    <Button
      type="button"
      size="sm"
      variant={compact ? "ghost" : "outline"}
      className={
        compact
          ? "h-7 shrink-0 px-2 text-xs"
          : "h-10 w-full max-w-full gap-1.5 px-3 text-sm sm:h-9 sm:w-auto sm:px-3"
      }
      disabled={pending || disabled}
      onClick={onClick}
    >
      {pending ? <Loader2 size={compact ? 12 : 14} className="animate-spin" /> : <CheckCheck size={compact ? 12 : 14} />}
      {label}
    </Button>
  );
}
