import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const user = await requireUser();
  const formData = await request.formData();
  const listingId = String(formData.get("listingId"));
  const file = formData.get("file") as File;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) return NextResponse.redirect(new URL("/sell", request.url));

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const path = `${listingId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET || "listing-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET || "listing-images").getPublicUrl(path);
  await prisma.listingImage.create({ data: { listingId, url: data.publicUrl } });

  return NextResponse.redirect(new URL(`/sell/${listingId}/edit`, request.url));
}
