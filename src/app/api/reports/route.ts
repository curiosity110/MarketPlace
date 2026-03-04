import { NextResponse } from "next/server";
import { ReportTargetType } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildRateLimitKey,
  consumeRateLimit,
  getIpHashFromHeaders,
  RateLimitExceededError,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  const form = await request.formData();
  const user = await getSessionUser();

  const targetType = String(form.get("targetType") || "");
  const targetId = String(form.get("targetId") || "");
  const reasonCode = String(form.get("reasonCode") || "").trim();
  const reasonFallback = String(form.get("reason") || "").trim();
  const reason = (reasonCode || reasonFallback).slice(0, 60);
  const detailsRaw = String(form.get("details") || "").trim();
  const details = detailsRaw ? detailsRaw.slice(0, 500) : null;
  const locale = String(form.get("locale") || "en") === "mk" ? "mk" : "en";
  const rateLimitMessage =
    locale === "mk" ? "Премногу обиди денес." : "Too many requests today.";
  const invalidMessage = locale === "mk" ? "Невалидна пријава." : "Invalid report.";
  const savedMessage =
    locale === "mk"
      ? "Пријавата е поднесена. Ви благодариме."
      : "Report submitted. Thank you.";
  const returnToRaw = String(form.get("returnTo") || "");
  const returnTo =
    returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
      ? returnToRaw
      : "/browse";

  if (
    !targetId ||
    reason.length < 2 ||
    !Object.values(ReportTargetType).includes(targetType as ReportTargetType)
  ) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(invalidMessage)}`, request.url),
    );
  }

  const listingId = String(form.get("listingId") || targetId).trim();
  if (!listingId) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(invalidMessage)}`, request.url),
    );
  }

  const ipHash = getIpHashFromHeaders(request.headers);
  const rateLimitKey = buildRateLimitKey({
    userId: user?.authUserId,
    ipHash,
  });

  try {
    await consumeRateLimit({
      action: "listing-report:create",
      key: rateLimitKey,
      limit: 3,
      locale,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.redirect(
        new URL(`${returnTo}?error=${encodeURIComponent(rateLimitMessage)}`, request.url),
      );
    }
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.listingReport.create({
      data: {
        listingId,
        reporterAuthUserId: user?.authUserId || null,
        reporterIpHash: ipHash,
        reason,
        details,
      },
    });

    if (user) {
      await tx.report.create({
        data: {
          reporterUserId: user.id,
          targetType: targetType as ReportTargetType,
          targetId,
          listingId,
          reason: details ? `${reason}: ${details}` : reason,
        },
      });
    }
  });

  return NextResponse.redirect(
    new URL(`${returnTo}?reported=1&msg=${encodeURIComponent(savedMessage)}`, request.url),
  );
}
