import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const form = await request.formData();
  const userId = String(form.get("userId"));
  const reportId = String(form.get("reportId"));

  await prisma.$transaction([
    prisma.user.updateMany({ where: { id: userId }, data: { bannedAt: new Date() } }),
    prisma.report.updateMany({ where: { id: reportId }, data: { status: "CLOSED", closedAt: new Date() } }),
    prisma.adminAction.create({ data: { adminId: admin.id, actionType: "BAN_USER", targetType: "USER", targetId: userId } }),
  ]);

  return NextResponse.redirect(new URL("/admin", request.url));
}
