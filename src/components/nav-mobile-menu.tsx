"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";
import type { Locale } from "@/lib/i18n";

type Props = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  locale: Locale;
  labels: {
    menu: string;
    profile: string;
    dashboard: string;
    admin: string;
    login: string;
    register: string;
    logout: string;
    language: string;
    english: string;
    macedonian: string;
    toggleTheme: string;
  };
};

function isSafePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

function shouldUseAsNext(path: string) {
  return !(
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/api/auth")
  );
}

function resolveNextPath(pathname: string) {
  if (!isSafePath(pathname) || !shouldUseAsNext(pathname)) return "/browse";
  return pathname;
}

export function NavMobileMenu({ isLoggedIn, isAdmin, locale, labels }: Props) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const nextPath = resolveNextPath(pathname);
  const encodedNext = encodeURIComponent(nextPath);
  const canPortal = typeof document !== "undefined";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
      const triggerButton = triggerRef.current?.querySelector("button");
      if (triggerButton instanceof HTMLButtonElement && triggerButton.isConnected) {
        triggerButton.focus();
      }
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0"
          aria-label={labels.menu}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </Button>
      </div>

      {open && canPortal
        ? createPortal(
            <div className="fixed inset-0 z-[90] sm:hidden">
              <button
                type="button"
                aria-label={labels.menu}
                className="absolute inset-0 bg-black/24 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
              />

              <div
                ref={panelRef}
                className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t-[1.75rem] border border-border/55 bg-background/96 p-4 shadow-[0_24px_64px_-32px_rgba(48,35,24,0.34)] backdrop-blur-xl"
                style={{ maxHeight: "min(82dvh, 42rem)" }}
                data-mobile-safe-bottom
                data-mobile-safe-top
              >
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border/80" aria-hidden="true" />
                <div className="space-y-4 overflow-y-auto pr-1">
                  {isLoggedIn ? (
                    <div className="space-y-2">
                      <Link href="/profile" onClick={() => setOpen(false)}>
                        <Button type="button" variant="outline" className="min-h-11 w-full justify-start">
                          {labels.profile}
                        </Button>
                      </Link>
                      <Link href="/dashboard" onClick={() => setOpen(false)}>
                        <Button type="button" variant="outline" className="min-h-11 w-full justify-start">
                          {labels.dashboard}
                        </Button>
                      </Link>
                      {isAdmin ? (
                        <Link href="/admin" onClick={() => setOpen(false)}>
                          <Button type="button" variant="outline" className="min-h-11 w-full justify-start">
                            {labels.admin}
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link href={`/login?next=${encodedNext}`} onClick={() => setOpen(false)}>
                        <Button type="button" className="min-h-11 w-full justify-start">
                          {labels.login}
                        </Button>
                      </Link>
                      <Link href={`/register?next=${encodedNext}`} onClick={() => setOpen(false)}>
                        <Button type="button" variant="outline" className="min-h-11 w-full justify-start">
                          {labels.register}
                        </Button>
                      </Link>
                    </div>
                  )}

                  <div className="space-y-3 border-t border-border/70 pt-4">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {labels.language}
                      </span>
                      <LanguageSwitcher
                        locale={locale}
                        label={labels.language}
                        englishLabel={labels.english}
                        macedonianLabel={labels.macedonian}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {labels.toggleTheme}
                      </span>
                      <ThemeToggle label={labels.toggleTheme} />
                    </div>
                    {isLoggedIn ? (
                      <form
                        action="/api/auth/logout"
                        method="post"
                        onSubmit={() => setOpen(false)}
                      >
                        <Button type="submit" variant="outline" className="min-h-11 w-full justify-start">
                          {labels.logout}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
