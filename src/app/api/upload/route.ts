import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { getSupabaseServiceConfig } from "@/lib/supabase/config";
import { getSafeErrorMessage, isLikelySupabaseConnectionError } from "@/lib/supabase/errors";

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    return NextResponse.redirect(
      new URL("/sell?error=Database%20is%20temporarily%20unreachable", request.url),
    );
  }

  const formData = await request.formData();
  const listingId = String(formData.get("listingId") || "");
  const file = formData.get("file");

  if (!listingId || !(file instanceof File)) {
    return NextResponse.redirect(new URL("/sell?error=Invalid upload request", request.url));
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.redirect(new URL(`/sell/${listingId}/edit?error=Only image files are allowed`, request.url));
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.redirect(
      new URL(`/sell/${listingId}/edit?error=Image must be 6MB or smaller`, request.url),
    );
  }

  let listing: Awaited<ReturnType<typeof prisma.listing.findUnique>>;
  try {
    listing = await prisma.listing.findUnique({ where: { id: listingId } });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return NextResponse.redirect(
        new URL(
          `/sell/${listingId}/edit?error=${encodeURIComponent("Database is temporarily unreachable")}`,
          request.url,
        ),
      );
    }
    throw error;
  }

  if (!listing || listing.sellerId !== user.id) {
    return NextResponse.redirect(new URL("/sell", request.url));
  }

  const supabaseConfig = getSupabaseServiceConfig();
  if (!supabaseConfig) {
    return NextResponse.redirect(
      new URL(
        `/sell/${listingId}/edit?error=${encodeURIComponent("Storage is not configured yet")}`,
        request.url,
      ),
    );
  }

  const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);

  const safeName = sanitizeFileName(file.name);
  const path = `${listingId}/${Date.now()}-${safeName}`;
  const bucket = supabaseConfig.storageBucket;

  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      return NextResponse.redirect(
        new URL(`/sell/${listingId}/edit?error=${encodeURIComponent(error.message)}`, request.url),
      );
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    try {
      await prisma.listingImage.create({ data: { listingId, url: data.publicUrl } });
      markPrismaHealthy();
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        return NextResponse.redirect(
          new URL(
            `/sell/${listingId}/edit?error=${encodeURIComponent("Database is temporarily unreachable")}`,
            request.url,
          ),
        );
      }
      throw error;
    }
  } catch (error) {
    const message = isLikelySupabaseConnectionError(error)
      ? "Storage host is unreachable. Check your Supabase URL and DNS."
      : getSafeErrorMessage(error, "Image upload failed.");

    return NextResponse.redirect(
      new URL(`/sell/${listingId}/edit?error=${encodeURIComponent(message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL(`/sell/${listingId}/edit`, request.url));
}
