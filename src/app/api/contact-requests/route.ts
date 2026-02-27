import { NextResponse } from "next/server";
import { ListingStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { sendContactRequestEmail } from "@/lib/notifications";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const requester = await requireUser();
  const url = new URL(request.url);

  if (shouldSkipPrismaCalls()) {
    return NextResponse.redirect(
      new URL("/browse?error=Database%20is%20temporarily%20unreachable", url.origin),
    );
  }

  const formData = await request.formData();
  const listingId = String(formData.get("listingId") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const trimmedMessage = message.slice(0, 1000);

  if (!listingId) {
    return NextResponse.redirect(
      new URL("/browse?error=Listing%20not%20found", url.origin),
    );
  }

  if (trimmedMessage.length < 8) {
    return NextResponse.redirect(
      new URL(`/listing/${listingId}?contact=invalid`, url.origin),
    );
  }

  try {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: ListingStatus.ACTIVE },
      include: { seller: { select: { id: true, email: true, name: true } } },
    });

    if (!listing) {
      return NextResponse.redirect(new URL("/browse?error=Listing%20not%20found", url.origin));
    }

    if (listing.seller.id === requester.id) {
      return NextResponse.redirect(
        new URL(`/listing/${listingId}?contact=self`, url.origin),
      );
    }

    const existingPending = await prisma.contactRequest.findFirst({
      where: {
        listingId,
        requesterUserId: requester.id,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (existingPending) {
      return NextResponse.redirect(
        new URL(`/listing/${listingId}?contact=pending`, url.origin),
      );
    }

    await prisma.contactRequest.create({
      data: {
        listingId,
        requesterUserId: requester.id,
        sellerUserId: listing.seller.id,
        message: trimmedMessage,
      },
    });

    markPrismaHealthy();

    await sendContactRequestEmail({
      sellerEmail: listing.seller.email,
      sellerName: listing.seller.name || listing.seller.email.split("@")[0],
      requesterIdentity: requester.email,
      listingTitle: listing.title,
      message: trimmedMessage,
      listingId,
    });

    return NextResponse.redirect(
      new URL(`/listing/${listingId}?contact=requested`, url.origin),
    );
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return NextResponse.redirect(
        new URL(`/listing/${listingId}?contact=dberror`, url.origin),
      );
    }
    throw error;
  }
}
