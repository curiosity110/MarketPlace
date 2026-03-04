"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  CirclePlus,
  CircleUserRound,
  House,
  LayoutDashboard,
  LogIn,
  Search,
} from "lucide-react";
import { isActivePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type Props = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  labels: {
    home: string;
    browse: string;
    sell: string;
    dashboard: string;
    login: string;
  };
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  show?: boolean;
};

export function MobileBottomNav({ isLoggedIn, isAdmin, labels }: Props) {
  const pathname = usePathname();
  const currentPath = pathname;
  const safeNextPath =
    currentPath.startsWith("/") &&
    !currentPath.startsWith("//") &&
    !currentPath.startsWith("/login") &&
    !currentPath.startsWith("/register") &&
    !currentPath.startsWith("/api/auth")
      ? currentPath
      : "/browse";
  const loginHref = `/login?next=${encodeURIComponent(safeNextPath)}`;

  const profileOrLoginHref = isLoggedIn ? "/dashboard" : loginHref;
  const profileOrLoginLabel = isLoggedIn ? labels.dashboard : labels.login;
  const profileOrLoginIcon = isLoggedIn ? LayoutDashboard : LogIn;

  const items: NavItem[] = [
    { href: "/", label: labels.home, icon: House, show: true },
    { href: "/browse", label: labels.browse, icon: Search, show: true },
    { href: "/sell", label: labels.sell, icon: CirclePlus, show: true },
    {
      href: isAdmin ? "/admin" : profileOrLoginHref,
      label: isAdmin ? labels.dashboard : profileOrLoginLabel,
      icon: isAdmin ? CircleUserRound : profileOrLoginIcon,
      show: true,
    },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1">
        {items
          .filter((item) => item.show !== false)
          .map((item) => {
            const active =
              item.href === "/admin"
                ? isActivePath(pathname, "/admin")
                : item.href === "/dashboard"
                  ? isActivePath(pathname, "/dashboard") || isActivePath(pathname, "/profile")
                : item.href.startsWith("/login")
                  ? isActivePath(pathname, "/profile") || isActivePath(pathname, "/dashboard")
                  : isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] transition-all",
                  active
                    ? "bg-muted font-semibold text-foreground ring-1 ring-border"
                    : "font-medium text-foreground/70 hover:bg-muted/70",
                )}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
