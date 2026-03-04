"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  markAllRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationListItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

type Props = {
  locale: "en" | "mk";
  items: NotificationListItem[];
};

export function NotificationsList({ locale, items }: Props) {
  const router = useRouter();
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(items.filter((item) => item.readAt).map((item) => item.id)),
  );
  const [isPending, startTransition] = useTransition();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        markRead: "Означи прочитано",
        markAllRead: "Означи сите прочитани",
      }
    : {
        markRead: "Mark read",
        markAllRead: "Mark all read",
      };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await markAllRead();
              setReadIds(new Set(items.map((item) => item.id)));
              router.refresh();
            });
          }}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
          {text.markAllRead}
        </Button>
      </div>

      {items.map((item) => {
        const isRead = Boolean(item.readAt) || readIds.has(item.id);
        const href = item.href || "/notifications";
        return (
          <div
            key={item.id}
            className={cn(
              "rounded-2xl border border-border/70 p-4",
              isRead ? "bg-muted/20" : "bg-card",
            )}
          >
            <Link href={href} className="block">
              <p className="text-sm font-bold">{item.title}</p>
              {item.body ? (
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString(
                  isMk ? "mk-MK" : "en-US",
                )}
              </p>
            </Link>
            {!isRead && (
              <div className="mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    startTransition(async () => {
                      await markNotificationRead(item.id);
                      setReadIds((prev) => new Set(prev).add(item.id));
                      router.refresh();
                    });
                  }}
                  disabled={isPending}
                >
                  {text.markRead}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
