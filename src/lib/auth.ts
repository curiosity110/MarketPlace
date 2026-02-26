import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string; // prisma user id
  email: string;
  role: Role;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const email = data.user.email?.toLowerCase();
  if (!email) return null;

  // Your schema supports email unique lookup (per Prisma error options).
  const userRecord = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, role: Role.USER },
    select: { id: true, email: true, role: true, bannedAt: true },
  });

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
