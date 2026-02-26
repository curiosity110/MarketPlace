import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string; // prisma user id
  supabaseUserId: string;
  email: string | null;
  role: Role;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const supabaseUserId = data.user.id;
  const email = data.user.email ?? null;

  // IMPORTANT: this requires Prisma User model has supabaseUserId @unique.
  const dbUser =
    (await prisma.user.findUnique({ where: { supabaseUserId } })) ??
    (await prisma.user.create({
      data: { supabaseUserId, email, role: Role.USER },
    }));

  // If your schema uses bannedAt instead of isBanned, keep this:
  if (dbUser.bannedAt) return null;

  return {
    id: dbUser.id,
    supabaseUserId,
    email: dbUser.email ?? email,
    role: dbUser.role,
  };
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