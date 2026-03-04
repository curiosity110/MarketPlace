import {
  Currency,
  ListingCondition,
  ListingStatus,
  PrismaClient,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_COUNT = 30;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const titleSeeds = [
  "Toyota Corolla 2012 clean condition",
  "Skopje apartment 52m2 near center",
  "iPhone 13 128GB excellent battery",
  "Samsung TV 55 inch 4K smart",
  "Part-time office assistant",
  "Gaming laptop RTX ready",
  "Dining table solid wood",
  "Winter jacket new condition",
  "Xiaomi Redmi Note unlocked",
  "Bike city commuter model",
];

async function main() {
  const seller = await prisma.user.findFirst({
    where: {
      role: { in: [Role.SELLER, Role.ADMIN, Role.CEO] },
      bannedAt: null,
    },
    select: { id: true, supabaseAuthId: true },
  });

  if (!seller) {
    throw new Error("No seller user found. Create at least one account first.");
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, parentId: true },
  });
  const cities = await prisma.city.findMany({
    select: { id: true, slug: true },
  });

  if (categories.length === 0 || cities.length === 0) {
    throw new Error("Categories and cities must exist before seeding demo listings.");
  }

  await prisma.listing.deleteMany({
    where: { title: { startsWith: "[DEMO]" } },
  });

  const now = Date.now();
  for (let index = 0; index < DEMO_COUNT; index += 1) {
    const category = categories[index % categories.length];
    const city = cities[(index * 3) % cities.length];
    const titleSeed = titleSeeds[index % titleSeeds.length];
    const currency = index % 2 === 0 ? Currency.MKD : Currency.EUR;
    const basePrice = 40 + (index % 15) * 35;
    const price = currency === Currency.MKD ? Math.round(basePrice * 61.5) : basePrice;
    const condition =
      index % 3 === 0
        ? ListingCondition.NEW
        : index % 3 === 1
          ? ListingCondition.USED
          : ListingCondition.REFURBISHED;

    const listing = await prisma.listing.create({
      data: {
        ownerId: seller.supabaseAuthId || seller.id,
        sellerId: seller.id,
        title: `[DEMO] ${titleSeed}`,
        description:
          "Demo listing for launch liquidity. Replace with real seller content as you onboard users.",
        priceCents: Math.round(price * 100),
        currency,
        categoryId: category.id,
        cityId: city.id,
        condition,
        status: ListingStatus.ACTIVE,
        activeUntil: new Date(now + THIRTY_DAYS_MS),
      },
      select: { id: true },
    });

    await prisma.listingImage.create({
      data: {
        listingId: listing.id,
        url: `https://picsum.photos/seed/demo-${category.slug}-${city.slug}-${index + 1}/1200/900`,
      },
    });
  }

  console.log(`Created ${DEMO_COUNT} demo listings.`);
}

main()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
