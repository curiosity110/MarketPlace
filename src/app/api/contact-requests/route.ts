import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ContactRequestStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import {
  buildRateLimitKey,
  consumeRateLimit,
  getIpHashFromHeaders,
  RateLimitExceededError,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const formData = await request.formData();
  const listingId = String(formData.get("listingId") || "").trim();
  const locale = String(formData.get("locale") || "en") === "mk" ? "mk" : "en";
  const returnToRaw = String(formData.get("returnTo") || "");
  const returnTo =
    returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
      ? returnToRaw
      : listingId
        ? `/listing/${listingId}`
        : "/browse";
  const messages =
    locale === "mk"
      ? {
          invalid: "Невалидно барање.",
          login: "Најави се за да го контактираш продавачот.",
          own: "Не можеш да го контактираш сопствениот оглас.",
          notFound: "Огласот не е достапен.",
          sent: "Пораката е испратена.",
          dbUnavailable: "Базата е привремено недостапна.",
        }
      : {
          invalid: "Invalid request.",
          login: "Log in to contact the seller.",
          own: "You cannot contact your own listing.",
          notFound: "Listing is not available.",
          sent: "Message sent.",
          dbUnavailable: "Database is temporarily unavailable.",
        };

  if (!listingId) {
    return NextResponse.redirect(
      new URL(`/browse?error=${encodeURIComponent(messages.invalid)}`, url.origin),
    );
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    const next = encodeURIComponent(returnTo);
    return NextResponse.redirect(new URL(`/login?next=${next}`, url.origin));
  }

  if (shouldSkipPrismaCalls()) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(messages.dbUnavailable)}`, url.origin),
    );
  }

  try {
    const ipHash = getIpHashFromHeaders(request.headers);
    const rateLimitKey = buildRateLimitKey({
      userId: sessionUser.authUserId,
      ipHash,
    });

    await consumeRateLimit({
      action: "contact-request:create",
      key: rateLimitKey,
      limit: 5,
      locale,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.redirect(
        new URL(`${returnTo}?error=${encodeURIComponent(error.message)}`, url.origin),
      );
    }
    throw error;
  }

  const buyerName = String(formData.get("buyerName") || "").trim().slice(0, 80);
  const buyerPhone = String(formData.get("buyerPhone") || "").trim().slice(0, 40);
  const messageRaw = String(formData.get("message") || "").trim();
  if (messageRaw.length < 2) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(messages.invalid)}`, url.origin),
    );
  }
  const messageLines = [
    buyerName ? `Name: ${buyerName}` : null,
    buyerPhone ? `Phone: ${buyerPhone}` : null,
    "",
    messageRaw.slice(0, 400),
  ].filter(Boolean);
  const message = messageLines.join("\n");

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        ownerId: true,
        sellerId: true,
        sale: { select: { id: true } },
      },
    });

    if (!listing || listing.sale) {
      return NextResponse.redirect(
        new URL(`${returnTo}?error=${encodeURIComponent(messages.notFound)}`, url.origin),
      );
    }

    if (listing.ownerId === sessionUser.authUserId) {
      return NextResponse.redirect(
        new URL(`${returnTo}?error=${encodeURIComponent(messages.own)}`, url.origin),
      );
    }

    const duplicatePending = await prisma.contactRequest.findFirst({
      where: {
        listingId: listing.id,
        requesterUserId: sessionUser.id,
        status: ContactRequestStatus.PENDING,
      },
      select: { id: true },
    });

    if (!duplicatePending) {
      await prisma.contactRequest.create({
        data: {
          listingId: listing.id,
          requesterUserId: sessionUser.id,
          sellerUserId: listing.sellerId,
          message,
        },
      });
    }

    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return NextResponse.redirect(
        new URL(`${returnTo}?error=${encodeURIComponent(messages.dbUnavailable)}`, url.origin),
      );
    }
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/listing/${listingId}`);
  return NextResponse.redirect(
    new URL(`${returnTo}?contacted=1&msg=${encodeURIComponent(messages.sent)}`, url.origin),
  );
}
