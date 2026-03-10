"use client";

import { useMemo, useState, useTransition } from "react";
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
  const [optimisticReadIds, setOptimisticReadIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const serverReadIds = useMemo(
    () => new Set(items.filter((item) => item.readAt).map((item) => item.id)),
    [items],
  );
  const unreadCount = useMemo(
    () =>
      items.reduce(
        (count, item) =>
          item.readAt || serverReadIds.has(item.id) || optimisticReadIds.has(item.id)
            ? count
            : count + 1,
        0,
      ),
    [items, optimisticReadIds, serverReadIds],
  );

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
              setOptimisticReadIds(new Set(items.map((item) => item.id)));
              router.refresh();
            });
          }}
        />
      </div>

      {items.map((item) => {
        const isRead =
          Boolean(item.readAt) || serverReadIds.has(item.id) || optimisticReadIds.has(item.id);

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
                setOptimisticReadIds((prev) => new Set(prev).add(item.id));
                router.refresh();
              });
            }}
          />
        );
      })}
    </div>
  );
}
