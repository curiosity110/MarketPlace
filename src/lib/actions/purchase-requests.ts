"use server";

import { PurchaseRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser, requireSeller } from "@/lib/auth";
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
  getIpHashFromServerActionHeaders,
  RateLimitExceededError,
} from "@/lib/rate-limit";
import { markListingSold } from "@/lib/actions/sales";

type ActionLocale = "en" | "mk";

function resolveLocale(raw: FormDataEntryValue | null): ActionLocale {
  return raw === "mk" ? "mk" : "en";
}

function getMessages(locale: ActionLocale) {
  if (locale === "mk") {
    return {
      dbUnavailable: "Базата е привремено недостапна.",
      invalidListing: "Невалиден оглас.",
      listingNotFound: "Огласот не е пронајден.",
      ownListing: "Не можеш да испратиш барање за сопствен оглас.",
      alreadyPending: "Веќе имаш активно барање за овој оглас.",
      phoneRequired: "Телефон е задолжителен за ова барање.",
      sent: "Барањето е испратено.",
      notFound: "Барањето не е пронајдено.",
      forbidden: "Немаш дозвола за ова барање.",
    };
  }

  return {
    dbUnavailable: "Database is temporarily unavailable.",
    invalidListing: "Invalid listing.",
    listingNotFound: "Listing not found.",
    ownListing: "You cannot request your own listing.",
    alreadyPending: "You already have a pending request for this listing.",
    phoneRequired: "Phone is required for this request.",
    sent: "Request sent.",
    notFound: "Request not found.",
    forbidden: "You do not have permission for this request.",
  };
}

function toSafeReturnPath(raw: string, fallback = "/browse") {
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

function appendStatus(path: string, key: string, value: string) {
  const url = new URL(path, "https://market.local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

export async function createPurchaseRequest(formData: FormData) {
  const locale = resolveLocale(formData.get("locale"));
  const text = getMessages(locale);
  const returnTo = toSafeReturnPath(String(formData.get("returnTo") || "/browse"));
  const listingId = String(formData.get("listingId") || "").trim();

  if (!listingId) {
    redirect(appendStatus(returnTo, "error", text.invalidListing));
  }

  if (shouldSkipPrismaCalls()) {
    redirect(appendStatus(returnTo, "error", text.dbUnavailable));
  }

  const buyerName = String(formData.get("buyerName") || "").trim().slice(0, 80) || null;
  const buyerPhone = String(formData.get("buyerPhone") || "").trim().slice(0, 40) || null;
  const message = String(formData.get("message") || "").trim().slice(0, 400) || null;
  const sessionUser = await getSessionUser();
  const buyerIpHash = await getIpHashFromServerActionHeaders();
  const rateLimitKey = buildRateLimitKey({
    userId: sessionUser?.authUserId,
    ipHash: buyerIpHash,
  });

  if (!sessionUser && !buyerPhone) {
    redirect(appendStatus(returnTo, "error", text.phoneRequired));
  }

  try {
    await consumeRateLimit({
      action: "purchase-request:create",
      key: rateLimitKey,
      limit: 5,
      locale,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      redirect(appendStatus(returnTo, "error", error.message));
    }
    throw error;
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        ownerId: true,
        sale: { select: { id: true } },
      },
    });

    if (!listing || listing.sale) {
      redirect(appendStatus(returnTo, "error", text.listingNotFound));
    }

    if (sessionUser?.authUserId === listing.ownerId) {
      redirect(appendStatus(returnTo, "error", text.ownListing));
    }

    const duplicate = await prisma.purchaseRequest.findFirst({
      where: {
        listingId: listing.id,
        status: PurchaseRequestStatus.PENDING,
        ...(sessionUser
          ? { buyerAuthUserId: sessionUser.authUserId }
          : { buyerIpHash }),
      },
      select: { id: true },
    });

    if (duplicate) {
      redirect(appendStatus(returnTo, "error", text.alreadyPending));
    }

    await prisma.purchaseRequest.create({
      data: {
        listingId: listing.id,
        sellerAuthUserId: listing.ownerId,
        buyerAuthUserId: sessionUser?.authUserId || null,
        buyerIpHash,
        buyerName,
        buyerPhone,
        message,
      },
    });

    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect(appendStatus(returnTo, "error", text.dbUnavailable));
    }
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/listing/${listingId}`);
  redirect(appendStatus(returnTo, "requested", "1"));
}

export async function respondPurchaseRequest(formData: FormData) {
  const locale = resolveLocale(formData.get("locale"));
  const text = getMessages(locale);
  const returnTo = toSafeReturnPath(String(formData.get("returnTo") || "/dashboard"));
  const requestId = String(formData.get("requestId") || "").trim();
  const action = String(formData.get("action") || "").trim().toLowerCase();
  const seller = await requireSeller();

  if (!requestId || (action !== "accept" && action !== "reject")) {
    redirect(appendStatus(returnTo, "error", text.notFound));
  }

  if (shouldSkipPrismaCalls()) {
    redirect(appendStatus(returnTo, "error", text.dbUnavailable));
  }

  try {
    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        listingId: true,
        sellerAuthUserId: true,
        buyerName: true,
        buyerPhone: true,
        status: true,
      },
    });

    if (!purchaseRequest) {
      redirect(appendStatus(returnTo, "error", text.notFound));
    }

    if (purchaseRequest.sellerAuthUserId !== seller.authUserId) {
      redirect(appendStatus(returnTo, "error", text.forbidden));
    }

    if (action === "reject") {
      await prisma.purchaseRequest.update({
        where: { id: requestId },
        data: { status: PurchaseRequestStatus.REJECTED },
      });
      revalidatePath("/dashboard");
      redirect(appendStatus(returnTo, "updated", "1"));
    }

    await prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: PurchaseRequestStatus.ACCEPTED },
    });

    const soldForm = new FormData();
    soldForm.set("listingId", purchaseRequest.listingId);
    soldForm.set("buyerName", purchaseRequest.buyerName || "");
    soldForm.set("buyerPhone", purchaseRequest.buyerPhone || "");
    soldForm.set("notes", "Accepted purchase request");
    soldForm.set("locale", locale);
    soldForm.set("returnTo", returnTo);
    await markListingSold(soldForm);
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect(appendStatus(returnTo, "error", text.dbUnavailable));
    }
    throw error;
  }
}
