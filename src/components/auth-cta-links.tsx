"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { en } from "@/messages/en";

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
  const candidate = pathname;
  if (!isSafePath(candidate) || !shouldUseAsNext(candidate)) return "/browse";
  return candidate;
}

export function AuthCtaLinks() {
  const pathname = usePathname() || "/";
  const nextPath = resolveNextPath(pathname);
  const encodedNext = encodeURIComponent(nextPath);

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Link href={`/register?next=${encodedNext}`}>
        <Button variant="outline" size="sm">
          {en.nav.register}
        </Button>
      </Link>
      <Link href={`/login?next=${encodedNext}`}>
        <Button size="sm">{en.nav.login}</Button>
      </Link>
    </div>
  );
}
