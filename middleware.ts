import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected =
    path.startsWith("/sell") ||
    path.startsWith("/admin") ||
    path.startsWith("/profile");

  if (!isProtected) return NextResponse.next();

  const accessToken = req.cookies.get("sb-access-token");
  const refreshToken = req.cookies.get("sb-refresh-token");
  if (!accessToken && !refreshToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", `${req.nextUrl.pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sell/:path*", "/admin/:path*", "/profile/:path*"],
};
