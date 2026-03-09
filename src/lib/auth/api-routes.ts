import { NextResponse } from "next/server";

export type AuthRouteResult = {
  ok: boolean;
  messageKey: string;
};

export const GENERIC_AUTH_ERROR: AuthRouteResult = {
  ok: false,
  messageKey: "auth.error.generic",
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function getSafeNextPath(nextPath: string | null | undefined) {
  if (!nextPath) return "/dashboard";
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return "/dashboard";
  if (nextPath === "/") return "/dashboard";
  return nextPath;
}

function normalizeSiteUrl(rawUrl: string | null | undefined) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function getOriginFromRequestUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return normalizeSiteUrl(parsed.origin);
  } catch {
    return null;
  }
}

export function resolveSiteUrlFromRequest(request: Request) {
  const fromRequestUrl = getOriginFromRequestUrl(request.url);
  if (fromRequestUrl) return fromRequestUrl;

  const requestHeaders = request.headers;
  const origin = normalizeSiteUrl(requestHeaders.get("origin"));
  if (origin) return origin;

  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = (forwardedHost?.split(",")[0] || requestHeaders.get("host") || "").trim();
  if (host) {
    const forwardedProto = requestHeaders.get("x-forwarded-proto");
    const protoCandidate = (forwardedProto?.split(",")[0] || "").trim().toLowerCase();
    const proto = protoCandidate === "https" ? "https" : "http";
    const derived = normalizeSiteUrl(`${proto}://${host}`);
    if (derived) return derived;
  }

  const configured = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) return configured;

  return "http://localhost:3000";
}

export function buildAuthCallbackUrl(siteUrl: string, nextPath: string | null | undefined) {
  const url = new URL("/api/auth/callback", siteUrl);
  url.searchParams.set("next", getSafeNextPath(nextPath));
  return url.toString();
}

export function isInvalidCredentialsError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid email or password")
  );
}

export function isEmailNotConfirmedError(message: string) {
  return message.toLowerCase().includes("email not confirmed");
}

export function isUserAlreadyRegisteredError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("user already registered") ||
    lower.includes("already been registered")
  );
}

export function authLog(
  name: string,
  data: { hasUser?: boolean; hasSession?: boolean } | null,
  error: { message: string } | null,
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log("[AUTH]", name, {
    data,
    error: error?.message,
  });
}

export async function parseJsonBody<T extends Record<string, unknown>>(request: Request) {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function jsonWithCookies(
  cookieCarrier: NextResponse,
  body: AuthRouteResult,
  status = 200,
) {
  const response = NextResponse.json(body, { status });

  const headerBag = cookieCarrier.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookieHeaders =
    typeof headerBag.getSetCookie === "function"
      ? headerBag.getSetCookie()
      : [];

  if (setCookieHeaders.length > 0) {
    setCookieHeaders.forEach((cookieHeader) => {
      response.headers.append("set-cookie", cookieHeader);
    });
    return response;
  }

  // Fallback for environments without getSetCookie().
  cookieCarrier.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  return response;
}
