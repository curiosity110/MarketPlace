import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { NextResponse } from "next/server";
import { SB_ACCESS_COOKIE } from "@/lib/supabase/cookies";

export async function createSupabaseServerClient(response?: NextResponse) {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              secure: process.env.NODE_ENV === "production",
            };

            cookieStore.set(name, value, cookieOptions);
            response?.cookies.set(name, value, cookieOptions);
          });
        },
      },
    }
  );
}

export const supabaseServer = createSupabaseServerClient;

export async function getAccessToken() {
  return cookies().get(SB_ACCESS_COOKIE)?.value;
}
