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

  const supaUser = data.user;
  const supabaseUserId = supaUser.id;
  const email = supaUser.email ?? null;

  // Make sure you have a User model with supabaseUserId unique.
  // If your field name differs (e.g. authUserId), change it here.
  const dbUser =
    (await prisma.user.findUnique({ where: { supabaseUserId } })) ??
    (await prisma.user.create({
      data: {
        supabaseUserId,
        email,
        role: Role.USER,
      },
    }));

  // Optional: block banned users if you have isBanned
  // If you don't have isBanned field, delete this block.
  if ((dbUser as any).isBanned) {
    // sign out not required; just block
    redirect("/login");
  }

  return {
    id: dbUser.id,
    supabaseUserId,
    email,
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
