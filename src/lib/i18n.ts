import { en } from "@/messages/en";
import { mk } from "@/messages/mk";

export const LOCALE_COOKIE = "locale";
export const LEGACY_LOCALE_COOKIE = "mp_locale";
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

function getMessageValue(
  messages: Record<string, unknown>,
  path: string,
): string | undefined {
  const segments = path.split(".").filter(Boolean);
  if (segments.length === 0) return undefined;

  let current: unknown = messages;
  for (const segment of segments) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" ? current : undefined;
}

export function t(locale: Locale, key: string): string {
  const localeMessages = getMessages(locale) as Record<string, unknown>;
  const enMessages = getMessages("en") as Record<string, unknown>;
  const mkMessages = getMessages("mk") as Record<string, unknown>;

  return (
    getMessageValue(localeMessages, key) ??
    getMessageValue(enMessages, key) ??
    getMessageValue(mkMessages, key) ??
    key
  );
}

export async function getServerLocale(): Promise<Locale> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const fromCookie =
    cookieStore.get(LOCALE_COOKIE)?.value ||
    cookieStore.get(LEGACY_LOCALE_COOKIE)?.value;
  return normalizeLocale(fromCookie);
}
