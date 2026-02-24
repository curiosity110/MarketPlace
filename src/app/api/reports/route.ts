import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();
  await prisma.report.create({
    data: {
      reporterUserId: user.id,
      targetType: String(form.get("targetType")) as never,
      targetId: String(form.get("targetId")),
      listingId: form.get("listingId") ? String(form.get("listingId")) : undefined,
      reason: String(form.get("reason")),
    },
  });
  return NextResponse.redirect(new URL("/browse", request.url));
}
