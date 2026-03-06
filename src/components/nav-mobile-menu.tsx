"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const nextPath = resolveNextPath(pathname);
  const encodedNext = encodeURIComponent(nextPath);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    if (open) {
      window.addEventListener("mousedown", onPointerDown);
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-9 p-0"
        aria-label={labels.menu}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X size={16} /> : <Menu size={16} />}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-[60] mt-2 w-[min(calc(100vw-0.75rem),17rem)] overflow-hidden rounded-2xl border border-border/80 bg-background p-2.5 shadow-2xl">
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {isLoggedIn ? (
              <div className="space-y-2">
                <Link href="/profile" onClick={() => setOpen(false)}>
                  <Button type="button" variant="outline" className="w-full justify-start">
                    {labels.profile}
                  </Button>
                </Link>
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button type="button" variant="outline" className="w-full justify-start">
                    {labels.dashboard}
                  </Button>
                </Link>
                {isAdmin ? (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    <Button type="button" variant="outline" className="w-full justify-start">
                      {labels.admin}
                    </Button>
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <Link href={`/login?next=${encodedNext}`} onClick={() => setOpen(false)}>
                  <Button type="button" className="w-full justify-start">
                    {labels.login}
                  </Button>
                </Link>
                <Link href={`/register?next=${encodedNext}`} onClick={() => setOpen(false)}>
                  <Button type="button" variant="outline" className="w-full justify-start">
                    {labels.register}
                  </Button>
                </Link>
              </div>
            )}

            <div className="space-y-2 border-t border-border/70 pt-3">
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
                  <Button type="submit" variant="outline" className="w-full justify-start">
                    {labels.logout}
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
