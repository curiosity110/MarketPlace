"use client";

import Link from "next/link";
import { en } from "@/messages/en";
import { Button } from "@/components/ui/button";

type ClientAuthButtonProps = {
  user: {
    email: string;
  } | null;
  logoutAction: () => void;
};

export function ClientAuthButton({ user, logoutAction }: ClientAuthButtonProps) {
  if (!user) {
    return (
      <Link href="/login" className="text-sm font-medium">
        {en.nav.login}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{user.email}</span>
      <form action={logoutAction}>
        <Button variant="outline" type="submit">
          {en.nav.logout}
        </Button>
      </form>
    </div>
  );
}
