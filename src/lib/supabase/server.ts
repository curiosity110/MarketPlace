import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
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
          // ✅ Only write cookies when we are in a Route Handler / Server Action
          // (i.e. when a NextResponse is provided).
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
