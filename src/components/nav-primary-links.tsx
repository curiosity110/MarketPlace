"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { isActivePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type Props = {
  labels: {
    browse: string;
    categories: string;
    sell: string;
    dashboard: string;
  };
  isLoggedIn: boolean;
};

export function NavPrimaryLinks({
  labels,
  isLoggedIn,
}: Props) {
  const isDev = process.env.NODE_ENV !== "production";
  const pathname = usePathname();
  const router = useRouter();
  const dashboardHref = isLoggedIn ? "/dashboard" : "/login?next=%2Fdashboard";
  const openCreateListing = useCallback(() => {
    if (!isLoggedIn) {
      const nextPath = pathname || "/browse";
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    if (isDev) {
      console.log("MODAL_CLICK", {
        source: "nav-primary-links",
        time: Date.now(),
      });
    }
    window.dispatchEvent(new CustomEvent("mkd:open-create-modal"));
  }, [isDev, isLoggedIn, pathname, router]);

  const links = [
    { href: "/browse", prefix: "/browse", label: labels.browse },
    { href: "/categories", prefix: "/categories", label: labels.categories },
    { href: "", prefix: "", label: labels.sell, action: openCreateListing },
    { href: dashboardHref, prefix: "/dashboard", label: labels.dashboard },
  ];

  return (
    <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-muted/30 p-1 md:flex">
      {links.map((item) => {
        const active = item.action
          ? false
          : item.prefix
            ? isActivePath(pathname, item.prefix)
            : false;
        const className = cn(
          "rounded-full px-3 py-1.5 text-sm transition-all",
          active
            ? "bg-muted font-semibold text-foreground ring-1 ring-border underline decoration-primary/50 underline-offset-4"
            : "font-medium text-foreground/75 hover:bg-card hover:text-foreground",
        );

        if (item.action) {
          return (
            <button
              key={`action-${item.label}`}
              type="button"
              onClick={item.action}
              className={className}
            >
              {item.label}
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={className}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
