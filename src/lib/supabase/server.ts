import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  getSupabasePublicConfig,
  getSupabasePublicConfigError,
} from "@/lib/supabase/config";

export async function createSupabaseServerClient(response?: NextResponse) {
  const cookieStore = await cookies();
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error(
      getSupabasePublicConfigError() || "Supabase auth is not configured.",
    );
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
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              secure: process.env.NODE_ENV === "production",
            };

            if (response) {
              response.cookies.set(name, value, cookieOptions);
              return;
            }

            // Server actions can write directly to cookieStore; server components cannot.
            try {
              cookieStore.set(name, value, cookieOptions);
            } catch {
              // Ignore when invoked from a read-only context.
            }
          });
        },
      },
    },
  );
}

// compatibility
export const supabaseServer = createSupabaseServerClient;
