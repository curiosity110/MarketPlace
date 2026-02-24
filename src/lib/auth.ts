import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAccessToken, supabaseServer } from "@/lib/supabase/server";

export async function getSessionUser() {
  const token = await getAccessToken();
  if (!token) return null;
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser(token);
  if (!data.user?.email) return null;

  const user = await prisma.user.upsert({
    where: { email: data.user.email.toLowerCase() },
    update: {},
    create: { email: data.user.email.toLowerCase() },
  });

  if (user.bannedAt) return null;
  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) redirect("/");
  return user;
}
