import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const preferredOwner =
    (await prisma.user.findFirst({
      where: { role: { in: [Role.ADMIN, Role.CEO] } },
      select: { id: true, email: true, supabaseAuthId: true },
      orderBy: { createdAt: "asc" },
    })) ||
    (await prisma.user.findFirst({
      select: { id: true, email: true, supabaseAuthId: true },
      orderBy: { createdAt: "asc" },
    }));

  if (!preferredOwner) {
    console.log("No users found. Skipping ownerId backfill.");
    return;
  }

  const authBackfillResult = await prisma.$executeRawUnsafe(
    `UPDATE "User" AS u
     SET "supabaseAuthId" = au.id::text
     FROM auth.users AS au
     WHERE lower(au.email) = lower(u.email)
       AND (u."supabaseAuthId" IS NULL OR u."supabaseAuthId" <> au.id::text)`,
  );

  const listingResult = await prisma.$executeRawUnsafe(
    `UPDATE "Listing" AS l
     SET "ownerId" = COALESCE(u."supabaseAuthId", l."ownerId")
     FROM "User" AS u
     WHERE l."sellerId" = u."id"`,
  );

  const categoryResult = await prisma.category.updateMany({
    where: { ownerId: null },
    data: { ownerId: preferredOwner.supabaseAuthId || preferredOwner.id },
  });

  console.log("ownerId backfill complete", {
    owner: preferredOwner.email,
    usersLinkedToAuth: Number(authBackfillResult),
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
