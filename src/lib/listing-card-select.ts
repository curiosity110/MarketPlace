import { Prisma } from "@prisma/client";

export const listingCardSelect = Prisma.validator<Prisma.ListingSelect>()({
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
      id: true,
      name: true,
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
      soldAt: true,
    },
  },
});

export type ListingCardDTO = Prisma.ListingGetPayload<{
  select: typeof listingCardSelect;
}>;
