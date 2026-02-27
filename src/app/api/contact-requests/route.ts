import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const formData = await request.formData();
  const listingId = String(formData.get("listingId") || "").trim();

  if (listingId) {
    return NextResponse.redirect(new URL(`/listing/${listingId}`, url.origin));
  }

  return NextResponse.redirect(new URL("/browse", url.origin));
}
