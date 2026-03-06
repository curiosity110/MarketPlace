"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
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
  key: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  href?: string;
  action?: () => void;
  show?: boolean;
};

const OPEN_CREATE_MODAL_EVENT = "mkd:open-create-modal";

export function MobileBottomNav({ isLoggedIn, isAdmin, labels }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
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

  const openCreateListing = useCallback(() => {
    const basePath = pathname || "/browse";
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("create", "1");
    const nextQuery = nextParams.toString();
    const createHref = nextQuery ? `${basePath}?${nextQuery}` : basePath;
    const openParams = Object.fromEntries(nextParams.entries());

    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(createHref)}`);
      return;
    }
    window.dispatchEvent(
      new CustomEvent(OPEN_CREATE_MODAL_EVENT, {
        detail: { params: openParams },
      }),
    );
  }, [isLoggedIn, pathname, router, searchParams]);

  const items: NavItem[] = [
    { key: "home", href: "/", label: labels.home, icon: House, show: true },
    {
      key: "browse",
      href: "/browse",
      label: labels.browse,
      icon: Search,
      show: true,
    },
    {
      key: "sell",
      label: labels.sell,
      icon: CirclePlus,
      action: openCreateListing,
      show: true,
    },
    {
      key: "profile",
      href: isAdmin ? "/admin" : profileOrLoginHref,
      label: isAdmin ? labels.dashboard : profileOrLoginLabel,
      icon: isAdmin ? CircleUserRound : profileOrLoginIcon,
      show: true,
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div className="pointer-events-auto mx-auto grid max-w-xl grid-cols-4 gap-1 rounded-[1.35rem] border border-border/70 bg-background/96 p-1.5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur-md">
        {items
          .filter((item) => item.show !== false)
          .map((item) => {
            const itemPath = item.href?.split("?")[0] ?? pathname;
            const active =
              item.key === "sell"
                ? false
                : item.href === "/admin"
                ? isActivePath(pathname, "/admin")
                : item.href === "/dashboard"
                  ? isActivePath(pathname, "/dashboard") || isActivePath(pathname, "/profile")
                : item.href?.startsWith("/login")
                  ? isActivePath(pathname, "/profile") || isActivePath(pathname, "/dashboard")
                  : isActivePath(pathname, itemPath);

            const className = cn(
              "flex flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] transition-all",
              active
                ? "bg-muted/85 font-semibold text-foreground"
                : "font-medium text-foreground/70 hover:bg-muted/60",
            );

            if (item.action) {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.action}
                  className={className}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href || "/"}
                className={className}
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
