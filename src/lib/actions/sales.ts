"use server";

import { ListingStatus, SaleMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/auth";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

type ActionLocale = "en" | "mk";

function resolveLocale(raw: FormDataEntryValue | null): ActionLocale {
  return raw === "mk" ? "mk" : "en";
}

function getMessages(locale: ActionLocale) {
  if (locale === "mk") {
    return {
      dbUnavailable: "Базата е привремено недостапна.",
      invalidListing: "Невалиден оглас.",
      notFound: "Огласот не е пронајден.",
      invalidPrice: "Невалидна продажна цена.",
      soldSuccess: "Огласот е означен како продаден.",
    };
  }

  return {
    dbUnavailable: "Database is temporarily unavailable.",
    invalidListing: "Invalid listing.",
    notFound: "Listing not found.",
    invalidPrice: "Invalid sold price.",
    soldSuccess: "Listing marked as sold.",
  };
}

function toSafeReturnPath(raw: string, fallback = "/dashboard") {
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

function appendStatus(path: string, key: string, value: string) {
  const url = new URL(path, "https://market.local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

function parseOptionalSoldPriceCents(raw: string) {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function parseSaleMethod(raw: string) {
  const upper = raw.trim().toUpperCase();
  if (upper === SaleMethod.CASH) return SaleMethod.CASH;
  if (upper === SaleMethod.BANK) return SaleMethod.BANK;
  if (upper === SaleMethod.CARD) return SaleMethod.CARD;
  if (upper === SaleMethod.OTHER) return SaleMethod.OTHER;
  return undefined;
}

export async function markListingSold(formData: FormData) {
  const locale = resolveLocale(formData.get("locale"));
  const text = getMessages(locale);
  const returnTo = toSafeReturnPath(String(formData.get("returnTo") || "/dashboard"));
  const listingId = String(formData.get("listingId") || "").trim();

  if (!listingId) {
    redirect(appendStatus(returnTo, "error", text.invalidListing));
  }

  if (shouldSkipPrismaCalls()) {
    redirect(appendStatus(returnTo, "error", text.dbUnavailable));
  }

  const soldPriceInput = String(formData.get("soldPrice") || "");
  const soldPriceCents = parseOptionalSoldPriceCents(soldPriceInput);
  if (soldPriceCents === null) {
    redirect(appendStatus(returnTo, "error", text.invalidPrice));
  }

  const buyerName = String(formData.get("buyerName") || "").trim().slice(0, 80) || null;
  const buyerPhone = String(formData.get("buyerPhone") || "").trim().slice(0, 40) || null;
  const notes = String(formData.get("notes") || "").trim().slice(0, 400) || null;
  const method = parseSaleMethod(String(formData.get("method") || ""));
  const user = await requireSeller();

  try {
    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: { id: listingId, ownerId: user.authUserId },
        select: {
          id: true,
          sellerId: true,
          priceCents: true,
          currency: true,
        },
      });

      if (!listing) {
        redirect(appendStatus(returnTo, "error", text.notFound));
      }

      const finalAmount = soldPriceCents ?? listing.priceCents;
      const now = new Date();

      await tx.sale.upsert({
        where: { listingId: listing.id },
        create: {
          listingId: listing.id,
          sellerId: listing.sellerId,
          amountCents: listing.priceCents,
          soldPriceCents,
          currency: listing.currency,
          platformFeeCents: 0,
          netAmountCents: finalAmount,
          buyerName,
          buyerPhone,
          buyerAuthUserId: null,
          method,
          notes,
          soldAt: now,
        },
        update: {
          soldPriceCents,
          currency: listing.currency,
          netAmountCents: finalAmount,
          buyerName,
          buyerPhone,
          method,
          notes,
          soldAt: now,
        },
      });

      await tx.listing.update({
        where: { id: listing.id },
        data: { status: ListingStatus.INACTIVE },
      });
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      redirect(appendStatus(returnTo, "error", text.dbUnavailable));
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/dashboard");
  revalidatePath(`/listing/${listingId}`);
  redirect(appendStatus(returnTo, "sold", "1"));
}
