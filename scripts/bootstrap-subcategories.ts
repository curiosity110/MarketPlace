import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const subcategoriesByParentSlug: Record<string, Array<{ name: string; slug: string }>> = {
  cars: [
    { name: "Sedans", slug: "cars-sedans" },
    { name: "SUVs", slug: "cars-suv" },
    { name: "Hatchbacks", slug: "cars-hatchback" },
  ],
  "real-estate": [
    { name: "Apartments", slug: "real-estate-apartments" },
    { name: "Houses", slug: "real-estate-houses" },
    { name: "Land", slug: "real-estate-land" },
  ],
  electronics: [
    { name: "Computers", slug: "electronics-computers" },
    { name: "TV & Audio", slug: "electronics-tv-audio" },
    { name: "Gaming", slug: "electronics-gaming" },
  ],
  jobs: [
    { name: "IT & Software", slug: "jobs-it-software" },
    { name: "Sales", slug: "jobs-sales" },
    { name: "Operations", slug: "jobs-operations" },
  ],
  services: [
    { name: "Repairs", slug: "services-repairs" },
    { name: "Cleaning", slug: "services-cleaning" },
    { name: "Transport", slug: "services-transport" },
  ],
  furniture: [
    { name: "Living Room", slug: "furniture-living-room" },
    { name: "Bedroom", slug: "furniture-bedroom" },
    { name: "Office", slug: "furniture-office" },
  ],
  phones: [
    { name: "iPhone", slug: "phones-iphone" },
    { name: "Samsung", slug: "phones-samsung" },
    { name: "Xiaomi", slug: "phones-xiaomi" },
  ],
  fashion: [
    { name: "Men", slug: "fashion-men" },
    { name: "Women", slug: "fashion-women" },
    { name: "Shoes", slug: "fashion-shoes" },
  ],
};

async function main() {
  const parents = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, slug: true, ownerId: true },
  });

  let upserted = 0;
  let skippedParents = 0;

  for (const parent of parents) {
    const children = subcategoriesByParentSlug[parent.slug];
    if (!children || children.length === 0) {
      skippedParents += 1;
      continue;
    }

    for (const child of children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          parentId: parent.id,
          isActive: true,
          ownerId: parent.ownerId,
        },
        create: {
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
          isActive: true,
          ownerId: parent.ownerId,
        },
      });
      upserted += 1;
    }
  }

  const totalChildren = await prisma.category.count({
    where: { parentId: { not: null }, isActive: true },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        parents: parents.length,
        skippedParents,
        upserted,
        totalChildren,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Failed to bootstrap subcategories:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
