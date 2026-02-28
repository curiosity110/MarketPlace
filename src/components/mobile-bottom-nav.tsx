"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  Compass,
  FolderKanban,
  Home,
  LogIn,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isLoggedIn: boolean;
  isAdmin: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  show?: boolean;
};

export function MobileBottomNav({ isLoggedIn, isAdmin }: Props) {
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

  const items: NavItem[] = [
    { href: "/", label: "Home", icon: Home, show: true },
    { href: "/browse", label: "Browse", icon: Compass, show: true },
    { href: "/categories", label: "Categories", icon: FolderKanban, show: true },
    {
      href: isAdmin ? "/admin" : isLoggedIn ? "/sell/analytics" : loginHref,
      label: isAdmin ? "Admin" : isLoggedIn ? "Dashboard" : "Login",
      icon: isAdmin ? Settings : isLoggedIn ? Compass : LogIn,
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
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-gradient-to-r from-orange-500 to-blue-600 text-white shadow-sm"
                    : "text-foreground/70 hover:bg-muted/70",
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
