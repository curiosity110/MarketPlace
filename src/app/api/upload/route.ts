import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { getSupabaseAdminStorageContext } from "@/lib/supabase/admin";
import { getSafeErrorMessage, isLikelySupabaseConnectionError } from "@/lib/supabase/errors";

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
const MAX_IMAGES_PER_LISTING = 10;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (shouldSkipPrismaCalls()) {
    return jsonError("Database is temporarily unreachable", 503);
  }

  const formData = await request.formData();
  const listingId = String(formData.get("listingId") || "");
  const file = formData.get("file");

  if (!listingId || !(file instanceof File)) {
    return jsonError("Invalid upload request", 400);
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    return jsonError("Only JPG, PNG, or WEBP images are allowed", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return jsonError("Image must be 6MB or smaller", 400);
  }

  let listing: Awaited<ReturnType<typeof prisma.listing.findUnique>>;
  try {
    listing = await prisma.listing.findUnique({ where: { id: listingId } });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return jsonError("Database is temporarily unreachable", 503);
    }
    throw error;
  }

  if (!listing || listing.sellerId !== user.id) {
    return jsonError("You do not have permission to upload for this listing", 403);
  }

  try {
    const imageCount = await prisma.listingImage.count({ where: { listingId } });
    markPrismaHealthy();
    if (imageCount >= MAX_IMAGES_PER_LISTING) {
      return jsonError(
        `You can upload up to ${MAX_IMAGES_PER_LISTING} images per listing`,
        400,
      );
    }
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return jsonError("Database is temporarily unreachable", 503);
    }
    throw error;
  }

  const { context: storageContext, error: storageError } =
    getSupabaseAdminStorageContext();
  if (!storageContext) {
    return jsonError(storageError || "Storage is not configured yet", 500);
  }

  const safeName = sanitizeFileName(file.name);
  const path = `${listingId}/${Date.now()}-${safeName}`;
  const bucket = storageContext.bucket;

  try {
    const { error } = await storageContext.client.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      return jsonError(error.message, 502);
    }

    const { data } = storageContext.client.storage.from(bucket).getPublicUrl(path);
    try {
      await prisma.listingImage.create({ data: { listingId, url: data.publicUrl } });
      markPrismaHealthy();
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        markPrismaUnavailable();
        return jsonError("Database is temporarily unreachable", 503);
      }
      throw error;
    }

    return NextResponse.json({ ok: true, url: data.publicUrl }, { status: 200 });
  } catch (error) {
    const message = isLikelySupabaseConnectionError(error)
      ? "Storage host is unreachable. Check your Supabase URL and DNS."
      : getSafeErrorMessage(error, "Image upload failed.");

    return jsonError(message, 500);
  }
}
