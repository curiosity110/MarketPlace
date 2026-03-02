import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const preferredOwner =
    (await prisma.user.findFirst({
      where: { role: { in: [Role.ADMIN, Role.CEO] } },
      select: { id: true, email: true },
      orderBy: { createdAt: "asc" },
    })) ||
    (await prisma.user.findFirst({
      select: { id: true, email: true },
      orderBy: { createdAt: "asc" },
    }));

  if (!preferredOwner) {
    console.log("No users found. Skipping ownerId backfill.");
    return;
  }

  const listingResult = await prisma.$executeRawUnsafe(
    'UPDATE "Listing" SET "ownerId" = "sellerId" WHERE "ownerId" IS NULL',
  );

  const categoryResult = await prisma.category.updateMany({
    where: { ownerId: null },
    data: { ownerId: preferredOwner.id },
  });

  console.log("ownerId backfill complete", {
    owner: preferredOwner.email,
    listingsUpdated: Number(listingResult),
    categoriesUpdated: categoryResult.count,
  });
}

main()
  .catch((error) => {
    console.error("ownerId backfill failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
