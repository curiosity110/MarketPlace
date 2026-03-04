"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  markAllRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

type Props = {
  locale: "en" | "mk";
  items: NotificationItem[];
  unreadCount: number;
};

export function NotificationsBell({ locale, items, unreadCount }: Props) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(items.filter((item) => item.readAt).map((item) => item.id)),
  );
  const [isPending, startTransition] = useTransition();

  const isMk = locale === "mk";
  const text = isMk
    ? {
        notifications: "Известувања",
        noNotifications: "Нема известувања.",
        markRead: "Означи прочитано",
        markAllRead: "Означи сите прочитани",
      }
    : {
        notifications: "Notifications",
        noNotifications: "No notifications.",
        markRead: "Mark read",
        markAllRead: "Mark all read",
      };

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }

    if (open) {
      window.addEventListener("mousedown", onPointerDown);
    }

    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const unreadLocalCount = items.reduce((sum, item) => {
    const isRead = item.readAt || readIds.has(item.id);
    return isRead ? sum : sum + 1;
  }, 0);
  const badgeCount = Math.max(unreadCount, unreadLocalCount);

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative h-9 w-9 p-0"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={text.notifications}
      >
        <Bell size={16} />
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] rounded-2xl border border-border bg-background p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-bold">{text.notifications}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              disabled={isPending || badgeCount === 0}
              onClick={() => {
                startTransition(async () => {
                  await markAllRead();
                  setReadIds(new Set(items.map((item) => item.id)));
                  router.refresh();
                });
              }}
            >
              {isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCheck size={12} />
              )}
              {text.markAllRead}
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
              {text.noNotifications}
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {items.map((item) => {
                const isRead = Boolean(item.readAt) || readIds.has(item.id);
                const href = item.href || "/notifications";

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl border border-border/70 p-2",
                      isRead ? "bg-muted/20" : "bg-card",
                    )}
                  >
                    <Link href={href} className="block">
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.body ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.body}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString(
                          isMk ? "mk-MK" : "en-US",
                        )}
                      </p>
                    </Link>
                    {!isRead && (
                      <div className="mt-1 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              await markNotificationRead(item.id);
                              setReadIds((prev) => new Set(prev).add(item.id));
                              router.refresh();
                            });
                          }}
                        >
                          {text.markRead}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
