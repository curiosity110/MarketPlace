import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function POST(request: Request) {
  const user = await requireUser();
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

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) {
    return NextResponse.redirect(new URL("/sell", request.url));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const safeName = sanitizeFileName(file.name);
  const path = `${listingId}/${Date.now()}-${safeName}`;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "listing-images";

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
  await prisma.listingImage.create({ data: { listingId, url: data.publicUrl } });

  return NextResponse.redirect(new URL(`/sell/${listingId}/edit`, request.url));
}
