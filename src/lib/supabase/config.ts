type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

type SupabaseServiceConfig = SupabasePublicConfig & {
  serviceRoleKey: string;
  storageBucket: string;
};

function hasPlaceholder(value: string) {
  return (
    value.includes("YOUR_PROJECT") ||
    value.includes("YOUR_SUPABASE_ANON_KEY") ||
    value.includes("YOUR_SUPABASE_SERVICE_ROLE_KEY")
  );
}

function normalizeUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  if (!rawUrl || !anonKey || hasPlaceholder(rawUrl) || hasPlaceholder(anonKey)) {
    return null;
  }

  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  return { url, anonKey };
}

export function getSupabaseServiceConfig(): SupabaseServiceConfig | null {
  const publicConfig = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  const storageBucket = (process.env.SUPABASE_STORAGE_BUCKET || "listing-images").trim();

  if (!publicConfig || !serviceRoleKey || hasPlaceholder(serviceRoleKey)) {
    return null;
  }

  return {
    ...publicConfig,
    serviceRoleKey,
    storageBucket: storageBucket || "listing-images",
  };
}
