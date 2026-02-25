import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { NextResponse } from "next/server";
import { SB_ACCESS_COOKIE } from "@/lib/supabase/cookies";

const isProduction = process.env.NODE_ENV === "production";

export async function createSupabaseServerClient(response?: NextResponse) {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions: CookieOptions = {
            ...options,
            secure: options?.secure ?? isProduction,
          };

          cookieStore.set(name, value, cookieOptions);
          response?.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });
}

export const supabaseServer = createSupabaseServerClient;

export async function getAccessToken() {
  return (await cookies()).get(SB_ACCESS_COOKIE)?.value;
}
