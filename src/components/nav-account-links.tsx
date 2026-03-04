"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isActivePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type Props = {
  isAdmin: boolean;
  adminLabel: string;
  profileLabel: string;
  logoutLabel: string;
};

export function NavAccountLinks({
  isAdmin,
  adminLabel,
  profileLabel,
  logoutLabel,
}: Props) {
  const pathname = usePathname();
  const isAdminActive = isActivePath(pathname, "/admin");
  const isProfileActive = isActivePath(pathname, "/profile");

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link href="/admin">
          <Button
            variant="outline"
            size="sm"
            type="button"
            className={cn(
              isAdminActive ? "bg-muted font-semibold ring-1 ring-border" : "",
            )}
          >
            {adminLabel}
          </Button>
        </Link>
      )}
      <Link href="/profile">
        <Button
          variant="outline"
          size="sm"
          type="button"
          className={cn(
            isProfileActive ? "bg-muted font-semibold ring-1 ring-border" : "",
          )}
        >
          {profileLabel}
        </Button>
      </Link>
      <form action="/api/auth/logout" method="post" className="contents">
        <Button variant="outline" size="sm" type="submit">
          {logoutLabel}
        </Button>
      </form>
    </div>
  );
}
