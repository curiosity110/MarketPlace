import { PrismaClient } from "@prisma/client";

function normalizeSupabasePoolerUrl(rawUrl: string | undefined) {
  if (!rawUrl) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    const isSupabasePooler = parsed.hostname.endsWith(".pooler.supabase.com");
    if (!isSupabasePooler) return rawUrl;

    let changed = false;
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1");
      changed = true;
    }
    if (parsed.port === "6543" && !parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
      changed = true;
    }

    if (!changed) return rawUrl;

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[prisma] Applied safe Supabase pooler defaults (connection_limit=1${
          parsed.port === "6543" ? ", pgbouncer=true" : ""
        }).`,
      );
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

const normalizedDatabaseUrl = normalizeSupabasePoolerUrl(process.env.DATABASE_URL);
if (normalizedDatabaseUrl && normalizedDatabaseUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = normalizedDatabaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
globalForPrisma.prisma = prisma;
