import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingCondition } from "@prisma/client";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const listing = await prisma.listing.create({
    data: {
      sellerId: user.id,
      title: body.title,
      description: body.description ?? "",
      priceCents: body.priceCents ?? 0,
      categoryId: body.categoryId,
      cityId: body.cityId,
      condition: (body.condition as ListingCondition) ?? ListingCondition.USED,
    },
  });
  return NextResponse.json(listing);
}
