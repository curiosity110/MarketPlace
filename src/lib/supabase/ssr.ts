import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none" | boolean;
  secure?: boolean;
};

type CookieMethods = {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookies: Array<{ name: string; value: string; options?: CookieOptions }>) => void;
};

export function createServerClient(
  supabaseUrl: string,
  supabaseKey: string,
  { cookies }: { cookies: CookieMethods },
): SupabaseClient {
  void cookies.getAll();
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        return response;
      },
    },
  });
}
