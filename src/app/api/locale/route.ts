import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

export async function POST(request: Request) {
  let locale = DEFAULT_LOCALE;
  try {
    const body = (await request.json()) as { locale?: string } | null;
    locale = normalizeLocale(body?.locale);
  } catch {
    locale = DEFAULT_LOCALE;
  }

  const response = NextResponse.json({ ok: true, locale });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

