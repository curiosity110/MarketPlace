"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  registerLabel: string;
  loginLabel: string;
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
  const candidate = pathname;
  if (!isSafePath(candidate) || !shouldUseAsNext(candidate)) return "/browse";
  return candidate;
}

export function AuthCtaLinks({ registerLabel, loginLabel }: Props) {
  const pathname = usePathname() || "/";
  const nextPath = resolveNextPath(pathname);
  const encodedNext = encodeURIComponent(nextPath);

  return (
    <div className="flex items-center gap-2">
      <Link href={`/register?next=${encodedNext}`}>
        <Button variant="outline" size="sm">
          {registerLabel}
        </Button>
      </Link>
      <Link href={`/login?next=${encodedNext}`}>
        <Button size="sm">{loginLabel}</Button>
      </Link>
    </div>
  );
}
