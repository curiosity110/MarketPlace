import { ListingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { listingCardSelect } from "@/lib/listing-card-select";
import { prisma } from "@/lib/prisma";

const MAX_IDS = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam || typeof idsParam !== "string") {
    return NextResponse.json({ listings: [] });
  }
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_IDS);
  if (ids.length === 0) {
    return NextResponse.json({ listings: [] });
  }

  const listings = await prisma.listing.findMany({
    where: {
      id: { in: ids },
      status: ListingStatus.ACTIVE,
      sale: null,
    },
    ...listingCardSelect,
    orderBy: { createdAt: "desc" },
  });

  const orderMap = new Map(ids.map((id, i) => [id, i]));
  const sorted = [...listings].sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));

  return NextResponse.json({ listings: sorted });
}
