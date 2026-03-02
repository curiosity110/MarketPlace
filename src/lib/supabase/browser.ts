"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabasePublicConfig,
  getSupabasePublicConfigError,
} from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error(
      getSupabasePublicConfigError() || "Supabase auth is not configured.",
    );
  }

  return createBrowserClient(config.url, config.anonKey);
}
