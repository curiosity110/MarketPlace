import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();

  if (error || !email) return null;

  const userRecord = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
    select: { id: true, email: true, role: true, bannedAt: true },
  });

  if (userRecord.bannedAt) return null;

  return { id: userRecord.id, email: userRecord.email, role: userRecord.role };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) redirect("/login");
  return user;
}
