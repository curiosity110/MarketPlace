import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasSupabaseAuthCookie(req: NextRequest) {
  const cookieNames = req.cookies.getAll().map((cookie) => cookie.name);

  if (
    cookieNames.includes("sb-access-token") ||
    cookieNames.includes("sb-refresh-token")
  ) {
    return true;
  }

  return cookieNames.some((name) => {
    if (!name.startsWith("sb-")) return false;
    return (
      name.includes("-auth-token") ||
      name.includes("-access-token") ||
      name.includes("-refresh-token")
    );
  });
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/sell") ||
    path.startsWith("/admin") ||
    path.startsWith("/profile");

  if (!isProtected) return NextResponse.next();

  if (!hasSupabaseAuthCookie(req)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", `${req.nextUrl.pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/sell",
    "/sell/:path*",
    "/admin",
    "/admin/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
