import { Prisma } from "@prisma/client";

export const listingCardSelect = Prisma.validator<Prisma.ListingDefaultArgs>()({
  select: {
    id: true,
    ownerId: true,
    title: true,
    priceCents: true,
    currency: true,
    condition: true,
    createdAt: true,
    status: true,
    seller: {
      select: {
        name: true,
        username: true,
        phone: true,
      },
    },
    city: {
      select: {
        id: true,
        name: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    },
    images: {
      select: {
        id: true,
        url: true,
      },
      take: 1,
      orderBy: {
        createdAt: "asc",
      },
    },
    sale: {
      select: {
        id: true,
      },
    },
  },
});

export type ListingCardDTO = Prisma.ListingGetPayload<typeof listingCardSelect>;
