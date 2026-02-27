import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireControlAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const admin = await requireControlAccess();
  const form = await request.formData();
  const listingId = String(form.get("listingId") || "");
  const reportId = String(form.get("reportId") || "");

  if (!listingId || !reportId) {
    return NextResponse.redirect(new URL("/admin?error=Invalid%20request", request.url));
  }

  await prisma.$transaction([
    prisma.listing.updateMany({
      where: { id: listingId },
      data: { status: "REMOVED" },
    }),
    prisma.report.updateMany({
      where: { id: reportId },
      data: { status: "CLOSED", closedAt: new Date() },
    }),
    prisma.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: "REMOVE_LISTING",
        targetType: "LISTING",
        targetId: listingId,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/browse");
  return NextResponse.redirect(new URL("/admin", request.url));
}
