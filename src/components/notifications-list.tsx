"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllRead, markNotificationRead } from "@/lib/actions/notifications";
import { NotificationItemCard } from "@/components/notifications/notification-item-card";
import { NotificationMarkAllButton } from "@/components/notifications/notification-mark-all-button";
import { getNotificationText } from "@/components/notifications/notification-text";

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
  const text = getNotificationText(locale);
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(items.filter((item) => item.readAt).map((item) => item.id)),
  );
  const [isPending, startTransition] = useTransition();
  const unreadCount = useMemo(
    () =>
      items.reduce(
        (count, item) => (item.readAt || readIds.has(item.id) ? count : count + 1),
        0,
      ),
    [items, readIds],
  );

  useEffect(() => {
    setReadIds(new Set(items.filter((item) => item.readAt).map((item) => item.id)));
  }, [items]);

  return (
    <div className="space-y-3">
      <div className="flex justify-stretch sm:justify-end">
        <NotificationMarkAllButton
          label={text.markAllRead}
          pending={isPending}
          disabled={unreadCount === 0}
          onClick={() => {
            startTransition(async () => {
              await markAllRead();
              setReadIds(new Set(items.map((item) => item.id)));
              router.refresh();
            });
          }}
        />
      </div>

      {items.map((item) => {
        const isRead = Boolean(item.readAt) || readIds.has(item.id);

        return (
          <NotificationItemCard
            key={item.id}
            locale={locale}
            item={item}
            isRead={isRead}
            markReadLabel={text.markRead}
            disabled={isPending}
            onMarkRead={() => {
              startTransition(async () => {
                await markNotificationRead(item.id);
                setReadIds((prev) => new Set(prev).add(item.id));
                router.refresh();
              });
            }}
          />
        );
      })}
    </div>
  );
}
