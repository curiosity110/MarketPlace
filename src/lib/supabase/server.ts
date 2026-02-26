import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export async function createSupabaseServerClient(response?: NextResponse) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Cookies can only be written when a response object exists.
          if (!response) return;

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === "production",
            });
          });
        },
      },
    },
  );
}

// compatibility
export const supabaseServer = createSupabaseServerClient;
