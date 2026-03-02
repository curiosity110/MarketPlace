import { cookies } from "next/headers";
import { en } from "@/messages/en";
import { mk } from "@/messages/mk";

export const LOCALE_COOKIE = "mp_locale";
export const DEFAULT_LOCALE = "en";

export type Messages = typeof en;
export type Locale = "en" | "mk";

function isLocale(value: string): value is Locale {
  return value === "en" || value === "mk";
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getMessages(locale: Locale): Messages {
  return locale === "mk" ? mk : en;
}

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  return normalizeLocale(fromCookie);
}

