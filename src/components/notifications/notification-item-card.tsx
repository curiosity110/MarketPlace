"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  locale: "en" | "mk";
  item: {
    title: string;
    body: string | null;
    href: string | null;
    createdAt: Date;
  };
  isRead: boolean;
  markReadLabel: string;
  compact?: boolean;
  disabled?: boolean;
  onOpen?: () => void;
  onMarkRead?: () => void;
};

export function NotificationItemCard({
  locale,
  item,
  isRead,
  markReadLabel,
  compact = false,
  disabled = false,
  onOpen,
  onMarkRead,
}: Props) {
  const href = item.href || "/notifications";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70",
        isRead ? "bg-muted/20" : "bg-card",
        compact ? "p-2" : "p-3.5 sm:rounded-2xl sm:p-4",
      )}
    >
      <Link href={href} className="block" onClick={onOpen}>
        <p
          className={cn(
            "font-semibold [overflow-wrap:anywhere]",
            compact ? "text-sm" : "text-sm font-bold leading-6",
          )}
        >
          {item.title}
        </p>
        {item.body ? (
          <p
            className={cn(
              "text-muted-foreground [overflow-wrap:anywhere]",
              compact ? "mt-0.5 text-xs" : "mt-1.5 text-sm leading-6",
            )}
          >
            {item.body}
          </p>
        ) : null}
        <p className={cn("text-muted-foreground", compact ? "mt-1 text-[11px]" : "mt-1 text-xs")}>
          {new Date(item.createdAt).toLocaleDateString(locale === "mk" ? "mk-MK" : "en-US")}
        </p>
      </Link>

      {!isRead && onMarkRead ? (
        <div className={cn(compact ? "mt-1 flex justify-end" : "mt-2")}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={compact ? "h-7 px-2 text-xs" : "min-h-10"}
            onClick={onMarkRead}
            disabled={disabled}
          >
            {markReadLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
