import { NextResponse } from "next/server";
import { ReportTargetType } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();

  const targetType = String(form.get("targetType") || "");
  const targetId = String(form.get("targetId") || "");
  const reason = String(form.get("reason") || "").trim();

  if (
    !targetId ||
    reason.length < 8 ||
    !Object.values(ReportTargetType).includes(targetType as ReportTargetType)
  ) {
    return NextResponse.redirect(new URL("/browse?error=Invalid%20report", request.url));
  }

  await prisma.report.create({
    data: {
      reporterUserId: user.id,
      targetType: targetType as ReportTargetType,
      targetId,
      listingId: form.get("listingId") ? String(form.get("listingId")) : undefined,
      reason,
    },
  });
  return NextResponse.redirect(new URL("/browse", request.url));
}
