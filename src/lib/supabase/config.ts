type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

type SupabaseServiceConfig = SupabasePublicConfig & {
  serviceRoleKey: string;
  storageBucket: string;
};

function readEnvValue(rawValue: string | undefined) {
  const trimmed = (rawValue || "").trim();
  if (!trimmed) return "";
  // Some env pull tools append literal "\r\n" to values. Strip only trailing escapes.
  return trimmed.replace(/(?:\\r\\n|\\r|\\n)+$/g, "").trim();
}

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

export function getSupabasePublicConfigError(): string | null {
  const rawUrl = readEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = readEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!rawUrl) return "Missing NEXT_PUBLIC_SUPABASE_URL.";
  if (hasPlaceholder(rawUrl)) return "NEXT_PUBLIC_SUPABASE_URL contains a placeholder value.";

  if (!anonKey) return "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  if (hasPlaceholder(anonKey)) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY contains a placeholder value.";
  }

  const url = normalizeUrl(rawUrl);
  if (!url) return "NEXT_PUBLIC_SUPABASE_URL is invalid.";

  return null;
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const configError = getSupabasePublicConfigError();
  if (configError) return null;

  const rawUrl = readEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = readEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  return { url, anonKey };
}

export function getSupabaseServiceConfigError(): string | null {
  const publicError = getSupabasePublicConfigError();
  if (publicError) return publicError;

  const serviceRoleKey = readEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!serviceRoleKey) return "Missing SUPABASE_SERVICE_ROLE_KEY.";
  if (hasPlaceholder(serviceRoleKey)) {
    return "SUPABASE_SERVICE_ROLE_KEY contains a placeholder value.";
  }

  return null;
}

export function getSupabaseServiceConfig(): SupabaseServiceConfig | null {
  const configError = getSupabaseServiceConfigError();
  if (configError) return null;

  const publicConfig = getSupabasePublicConfig();
  const serviceRoleKey = readEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const storageBucket =
    readEnvValue(process.env.SUPABASE_STORAGE_BUCKET) || "listing-images";
  if (!publicConfig) {
    return null;
  }

  return {
    ...publicConfig,
    serviceRoleKey,
    storageBucket: storageBucket || "listing-images",
  };
}
