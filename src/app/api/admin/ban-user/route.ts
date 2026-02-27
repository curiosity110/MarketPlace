import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireControlAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const admin = await requireControlAccess();
  const form = await request.formData();
  const userId = String(form.get("userId") || "");
  const reportId = String(form.get("reportId") || "");

  if (!userId || !reportId) {
    return NextResponse.redirect(new URL("/admin?error=Invalid%20request", request.url));
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: userId },
      data: { bannedAt: new Date() },
    }),
    prisma.report.updateMany({
      where: { id: reportId },
      data: { status: "CLOSED", closedAt: new Date() },
    }),
    prisma.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: "BAN_USER",
        targetType: "USER",
        targetId: userId,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/browse");
  return NextResponse.redirect(new URL("/admin", request.url));
}
