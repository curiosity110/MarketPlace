import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_LOCALE = "mk";
const LOCALE_COOKIE = "locale";
const LEGACY_LOCALE_COOKIE = "mp_locale";

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

  const response = NextResponse.next();
  const hasLocaleCookie =
    Boolean(req.cookies.get(LOCALE_COOKIE)?.value) ||
    Boolean(req.cookies.get(LEGACY_LOCALE_COOKIE)?.value);
  if (!hasLocaleCookie) {
    response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    response.cookies.set(LEGACY_LOCALE_COOKIE, DEFAULT_LOCALE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  if (!isProtected) return response;

  if (!hasSupabaseAuthCookie(req)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", `${req.nextUrl.pathname}${req.nextUrl.search}`);
    const redirectResponse = NextResponse.redirect(loginUrl);
    if (!hasLocaleCookie) {
      redirectResponse.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      redirectResponse.cookies.set(LEGACY_LOCALE_COOKIE, DEFAULT_LOCALE, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
