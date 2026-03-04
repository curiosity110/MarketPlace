"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildCreateListingHref } from "@/lib/create-listing-href";
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
  const pathname = usePathname();
  const dashboardHref = isLoggedIn ? "/dashboard" : "/login?next=%2Fdashboard";
  const sellHref = buildCreateListingHref();
  const sellPrefix = "/sell";
  const links = [
    { href: "/browse", prefix: "/browse", label: labels.browse },
    { href: "/categories", prefix: "/categories", label: labels.categories },
    { href: sellHref, prefix: sellPrefix, label: labels.sell },
    { href: dashboardHref, prefix: "/dashboard", label: labels.dashboard },
  ];

  return (
    <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-muted/30 p-1 md:flex">
      {links.map((item) => {
        const active = item.prefix
          ? isActivePath(pathname, item.prefix)
          : false;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-all",
              active
                ? "bg-muted font-semibold text-foreground ring-1 ring-border underline decoration-primary/50 underline-offset-4"
                : "font-medium text-foreground/75 hover:bg-card hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
