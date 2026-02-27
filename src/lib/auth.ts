import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import {
  markSupabaseHealthy,
  markSupabaseUnavailable,
  shouldSkipSupabaseCalls,
} from "@/lib/supabase/circuit-breaker";
import { isLikelySupabaseConnectionError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string; // prisma user id
  email: string;
  role: Role;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (
    !getSupabasePublicConfig() ||
    shouldSkipSupabaseCalls() ||
    shouldSkipPrismaCalls()
  ) {
    return null;
  }

  let userData: { email?: string | null } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    markSupabaseHealthy();
    userData = data.user;
  } catch (error) {
    if (isLikelySupabaseConnectionError(error)) {
      markSupabaseUnavailable();
    }
    // Supabase network/config issues should not crash app rendering.
    return null;
  }

  const email = userData.email?.toLowerCase();
  if (!email) return null;

  // Your schema supports email unique lookup (per Prisma error options).
  let userRecord: {
    id: string;
    email: string;
    role: Role;
    bannedAt: Date | null;
  };
  try {
    userRecord = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, role: Role.USER },
      select: { id: true, email: true, role: true, bannedAt: true },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return null;
    }
    throw error;
  }

  // If your schema uses bannedAt instead of isBanned, keep this:
  if (userRecord.bannedAt) return null;

  return { id: userRecord.id, email: userRecord.email, role: userRecord.role };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) redirect("/browse");
  return user;
}
