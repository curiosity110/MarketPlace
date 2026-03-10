"use client";

import { createPortal } from "react-dom";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { markAllRead, markNotificationRead } from "@/lib/actions/notifications";
import { NotificationItemCard } from "@/components/notifications/notification-item-card";
import { NotificationMarkAllButton } from "@/components/notifications/notification-mark-all-button";
import { getNotificationText } from "@/components/notifications/notification-text";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";
import { Button } from "@/components/ui/button";

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

const DESKTOP_SIDE_OFFSET = 8;
const DESKTOP_COLLISION_PADDING = 12;

function NotificationsBellComponent({ locale, items, unreadCount }: Props) {
  const router = useRouter();
  const text = getNotificationText(locale);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 639px)").matches;
  });
  const [desktopPanelStyle, setDesktopPanelStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [optimisticReadIds, setOptimisticReadIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const closePanel = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const triggerElement = triggerRef.current;

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (isMobile) {
      lockBodyScroll();
    }

    return () => {
      if (isMobile) {
        unlockBodyScroll();
      }
      const triggerButton = triggerElement?.querySelector("button");
      if (triggerButton instanceof HTMLButtonElement && triggerButton.isConnected) {
        triggerButton.focus();
      } else if (previousActiveElementRef.current?.isConnected) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isMobile, open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 639px)");
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const updateDesktopPosition = useCallback(() => {
    if (typeof window === "undefined" || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const width = Math.min(window.innerWidth * 0.92, 360);
    const alignEndLeft = rect.right - width;
    const maxLeft = window.innerWidth - width - DESKTOP_COLLISION_PADDING;
    const left = Math.max(DESKTOP_COLLISION_PADDING, Math.min(alignEndLeft, maxLeft));

    const estimatedPanelHeight =
      panelRef.current?.offsetHeight ?? Math.min(window.innerHeight * 0.6, 420);
    const preferredTop = rect.bottom + DESKTOP_SIDE_OFFSET;
    const maxTop = window.innerHeight - estimatedPanelHeight - DESKTOP_COLLISION_PADDING;
    const top = Math.max(DESKTOP_COLLISION_PADDING, Math.min(preferredTop, maxTop));

    setDesktopPanelStyle({ top, left, width });
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closePanel();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closePanel, open]);

  useEffect(() => {
    if (!open || isMobile) return;

    const raf = window.requestAnimationFrame(updateDesktopPosition);
    window.addEventListener("resize", updateDesktopPosition);
    window.addEventListener("scroll", updateDesktopPosition, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateDesktopPosition);
      window.removeEventListener("scroll", updateDesktopPosition, true);
    };
  }, [isMobile, open, updateDesktopPosition]);

  const serverReadIds = useMemo(
    () => new Set(items.filter((item) => item.readAt).map((item) => item.id)),
    [items],
  );

  const unreadLocalCount = useMemo(
    () =>
      items.reduce((sum, item) => {
        const isRead = item.readAt || serverReadIds.has(item.id) || optimisticReadIds.has(item.id);
        return isRead ? sum : sum + 1;
      }, 0),
    [items, optimisticReadIds, serverReadIds],
  );
  const badgeCount = Math.max(unreadCount, unreadLocalCount);
  const canPortal = typeof document !== "undefined";

  const markAll = () => {
    startTransition(async () => {
      await markAllRead();
      setOptimisticReadIds(new Set(items.map((item) => item.id)));
      router.refresh();
    });
  };

  const panelContent = (
    <div className="space-y-2.5 p-3 sm:p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{text.notifications}</p>
        <NotificationMarkAllButton
          label={text.markAllRead}
          pending={isPending}
          disabled={badgeCount === 0}
          compact
          onClick={markAll}
        />
      </div>

      {items.length === 0 ? (
        <p className="rounded-[1rem] border border-border/60 bg-muted/18 p-3 text-sm text-muted-foreground">
          {text.noNotifications}
        </p>
      ) : (
        <div className="max-h-[min(50dvh,23rem)] space-y-2 overflow-auto pr-1 sm:max-h-[60vh]">
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
                compact
                disabled={isPending}
                onOpen={closePanel}
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
      )}
    </div>
  );

  return (
    <>
      <div ref={triggerRef}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="relative h-11 w-11 p-0"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={text.notifications}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <Bell size={16} />
          {badgeCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          ) : null}
        </Button>
      </div>

      {open && !isMobile && canPortal && desktopPanelStyle
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[90] rounded-[1.6rem] border border-border/55 bg-background/95 shadow-[0_24px_64px_-32px_rgba(48,35,24,0.34)] backdrop-blur-xl"
              style={desktopPanelStyle}
            >
              {panelContent}
            </div>,
            document.body,
          )
        : null}

      {open && isMobile && canPortal
        ? createPortal(
            <div className="fixed inset-0 z-[90] sm:hidden">
              <button
                type="button"
                aria-label={text.notifications}
                className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
                onClick={closePanel}
              />
              <div
                ref={panelRef}
                className="absolute inset-x-2.5 max-h-[68dvh] overflow-hidden rounded-[1.35rem] border border-border/45 bg-background/97 shadow-[0_24px_64px_-36px_rgba(48,35,24,0.32)] backdrop-blur-xl"
                style={{ bottom: "calc(var(--app-mobile-fab-offset) + env(safe-area-inset-bottom, 0px))" }}
                data-mobile-safe-bottom="overlay"
              >
                {panelContent}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export const NotificationsBell = React.memo(NotificationsBellComponent);

NotificationsBell.displayName = "NotificationsBell";
