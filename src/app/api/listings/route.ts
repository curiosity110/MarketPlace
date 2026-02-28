import { NextResponse } from "next/server";
import { ListingCondition, Role } from "@prisma/client";
import { z } from "zod";
import { canSell, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createListingSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(4000),
  price: z.coerce.number().min(0).optional(),
  categoryId: z.string().trim().min(1),
  cityId: z.string().trim().min(1),
  images: z.array(z.string().trim().min(1)).max(10).optional(),
  condition: z.nativeEnum(ListingCondition).optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canSell(user.role) || (user.role !== Role.SELLER && user.role !== Role.ADMIN)) {
    return NextResponse.json(
      { error: "Forbidden. Only sellers and admins can create listings." },
      { status: 403 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createListingSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  const listing = await prisma.listing.create({
    data: {
      sellerId: user.id,
      title: payload.title,
      description: payload.description,
      priceCents:
        typeof payload.price === "number" && Number.isFinite(payload.price)
          ? Math.round(payload.price * 100)
          : 0,
      categoryId: payload.categoryId,
      cityId: payload.cityId,
      condition: payload.condition ?? ListingCondition.USED,
      ...(payload.images && payload.images.length > 0
        ? {
            images: {
              create: payload.images.map((url) => ({ url })),
            },
          }
        : {}),
    },
    include: { images: true },
  });

  return NextResponse.json(listing, { status: 201 });
}
