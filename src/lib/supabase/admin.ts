import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceConfig,
  getSupabaseServiceConfigError,
} from "@/lib/supabase/config";

type SupabaseAdminStorageContext = {
  client: SupabaseClient;
  bucket: string;
};

export function getSupabaseAdminStorageContext(): {
  context: SupabaseAdminStorageContext | null;
  error: string | null;
} {
  const config = getSupabaseServiceConfig();
  if (!config) {
    return {
      context: null,
      error:
        getSupabaseServiceConfigError() ||
        "Supabase storage is not configured.",
    };
  }

  // Service-role client only for server-side storage/admin actions.
  // It never uses cookie sessions.
  const client = createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return {
    context: {
      client,
      bucket: config.storageBucket,
    },
    error: null,
  };
}
