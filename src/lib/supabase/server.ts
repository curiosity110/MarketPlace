import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { SB_ACCESS_COOKIE } from "@/lib/supabase/cookies";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createSupabaseServerClient(response?: NextResponse) {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          const normalizedOptions: CookieOptions = {
            ...options,
            secure: process.env.NODE_ENV === "production" ? options?.secure ?? true : false,
          };

          cookieStore.set(name, value, normalizedOptions);
          response?.cookies.set(name, value, normalizedOptions);
        }
      },
    },
  });
}

export const supabaseServer = createSupabaseServerClient;

export async function getAccessToken() {
  return (await cookies()).get(SB_ACCESS_COOKIE)?.value;
}
