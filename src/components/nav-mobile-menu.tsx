"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, LayoutDashboard, Menu, UserRound, X } from "lucide-react";
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
    favorites: string;
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
  return (
    <NavMobileMenuContent
      key={pathname}
      pathname={pathname}
      isLoggedIn={isLoggedIn}
      isAdmin={isAdmin}
      locale={locale}
      labels={labels}
    />
  );
}

type ContentProps = Props & {
  pathname: string;
};

function NavMobileMenuContent({
  pathname,
  isLoggedIn,
  isAdmin,
  locale,
  labels,
}: ContentProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const nextPath = resolveNextPath(pathname);
  const encodedNext = encodeURIComponent(nextPath);
  const canPortal = typeof document !== "undefined";

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
    const triggerElement = triggerRef.current;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
      const triggerButton = triggerElement?.querySelector("button");
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
          className="h-11 w-11 p-0"
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
                className="absolute inset-x-2.5 overflow-hidden rounded-[1.35rem] border border-border/45 bg-background/97 p-3 shadow-[0_24px_64px_-32px_rgba(48,35,24,0.3)] backdrop-blur-xl"
                style={{ bottom: "calc(var(--app-mobile-fab-offset) + env(safe-area-inset-bottom, 0px))", maxHeight: "min(72dvh, 38rem)" }}
                data-mobile-safe-bottom="overlay"
                data-mobile-safe-top
              >
                <div className="mx-auto mb-2.5 h-1.5 w-10 rounded-full bg-border/75" aria-hidden="true" />
                <div className="space-y-2.5 overflow-y-auto pr-0.5">
                  {isLoggedIn ? (
                    <div className="space-y-2 rounded-[1rem] bg-muted/14 p-2.5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                      <Link href="/profile" onClick={() => setOpen(false)}>
                        <Button type="button" variant="outline" className="min-h-11 w-full justify-start gap-2">
                          <UserRound size={16} className="shrink-0 text-muted-foreground" />
                          {labels.profile}
                        </Button>
                      </Link>
                      <Link href="/favorites" onClick={() => setOpen(false)}>
                        <Button type="button" variant="outline" className="min-h-11 w-full justify-start gap-2">
                          <Heart size={16} className="shrink-0 text-orange-500 fill-orange-500" />
                          {labels.favorites}
                        </Button>
                      </Link>
                      <Link href="/dashboard" onClick={() => setOpen(false)}>
                        <Button type="button" variant="outline" className="min-h-11 w-full justify-start gap-2">
                          <LayoutDashboard size={16} className="shrink-0 text-muted-foreground" />
                          {labels.dashboard}
                        </Button>
                      </Link>
                      {isAdmin ? (
                        <Link href="/admin" onClick={() => setOpen(false)}>
                          <Button type="button" variant="outline" className="min-h-11 w-full justify-start gap-2">
                            <UserRound size={16} className="shrink-0 text-muted-foreground" />
                            {labels.admin}
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-[1rem] bg-muted/14 p-2.5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
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

                  <div className="space-y-2.5 rounded-[1rem] border border-border/50 bg-background/72 p-3">
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
