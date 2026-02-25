import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";

export type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

type CookieMethods = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => void;
};

export function createServerClient(url: string, key: string, config: { cookies: CookieMethods }) {
  const cookieStore = config.cookies;
  const options: SupabaseClientOptions<"public"> = {
    auth: {
      flowType: "pkce",
      persistSession: false,
      autoRefreshToken: false,
      storage: {
        getItem: (cookieName: string) => cookieStore.getAll().find((cookie) => cookie.name === cookieName)?.value ?? null,
        setItem: (cookieName: string, value: string) => cookieStore.setAll([{ name: cookieName, value }]),
        removeItem: (cookieName: string) => cookieStore.setAll([{ name: cookieName, value: "", options: { maxAge: 0, path: "/" } }]),
      },
    },
  };

  return createClient(url, key, options);
}
