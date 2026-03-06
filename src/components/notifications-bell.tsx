"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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

const DESKTOP_SIDE_OFFSET = 8;
const DESKTOP_COLLISION_PADDING = 12;

export function NotificationsBell({ locale, items, unreadCount }: Props) {
  const router = useRouter();
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (!open) return;
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const updateDesktopPosition = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    const width = Math.min(window.innerWidth * 0.92, 360);
    const alignEndLeft = rect.right - width;
    const maxLeft = window.innerWidth - width - DESKTOP_COLLISION_PADDING;
    const left = Math.max(
      DESKTOP_COLLISION_PADDING,
      Math.min(alignEndLeft, maxLeft),
    );

    const estimatedPanelHeight =
      panelRef.current?.offsetHeight ?? Math.min(window.innerHeight * 0.6, 420);
    const preferredTop = rect.bottom + DESKTOP_SIDE_OFFSET;
    const maxTop =
      window.innerHeight - estimatedPanelHeight - DESKTOP_COLLISION_PADDING;
    const top = Math.max(
      DESKTOP_COLLISION_PADDING,
      Math.min(preferredTop, maxTop),
    );

    setDesktopPanelStyle({ top, left, width });
  }, []);

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

  const unreadLocalCount = items.reduce((sum, item) => {
    const isRead = item.readAt || readIds.has(item.id);
    return isRead ? sum : sum + 1;
  }, 0);
  const badgeCount = Math.max(unreadCount, unreadLocalCount);

  const panelContent = (
    <div className="space-y-2 p-2.5 sm:p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{text.notifications}</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 shrink-0 px-2 text-xs"
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
        <div className="max-h-[min(52dvh,24rem)] space-y-2 overflow-auto pr-1 sm:max-h-[60vh]">
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
                <Link
                  href={href}
                  className="block"
                  onClick={() => setOpen(false)}
                >
                  <p className="text-sm font-semibold [overflow-wrap:anywhere]">{item.title}</p>
                  {item.body ? (
                    <p className="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">
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
  );

  const canPortal = typeof document !== "undefined";

  return (
    <div className="relative" ref={triggerRef}>
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

      {open && !isMobile && canPortal && desktopPanelStyle
        ? createPortal(
            <div
              ref={panelRef}
              className="z-[60] w-[min(92vw,360px)] rounded-2xl border border-border bg-background shadow-2xl"
              style={{
                position: "fixed",
                top: desktopPanelStyle.top,
                left: desktopPanelStyle.left,
                width: desktopPanelStyle.width,
              }}
            >
              {panelContent}
            </div>,
            document.body,
          )
        : null}

      {open && isMobile && canPortal
        ? createPortal(
            <div className="fixed inset-0 z-[60] sm:hidden">
              <button
                type="button"
                aria-label={text.notifications}
                className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
                onClick={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                className="absolute inset-x-2 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 max-h-[68dvh] overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/98 shadow-[0_24px_64px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                {panelContent}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
