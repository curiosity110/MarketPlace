import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function createSupabaseServerClient(response?: NextResponse) {
  const cookieStore = await cookies();
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error("Supabase auth is not configured.");
  }

  return createServerClient(
    config.url,
    config.anonKey,
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
