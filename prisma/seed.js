/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient, Role, CategoryFieldType } = require("@prisma/client");

const prisma = new PrismaClient();

const categories = [
  ["Cars", "cars"],
  ["Real Estate", "real-estate"],
  ["Electronics", "electronics"],
  ["Jobs", "jobs"],
  ["Services", "services"],
  ["Furniture", "furniture"],
  ["Phones", "phones"],
  ["Fashion", "fashion"],
];

const templatesByCategorySlug = {
  cars: [
    {
      key: "brand",
      label: "Brand",
      type: CategoryFieldType.TEXT,
      required: true,
      order: 1,
    },
    {
      key: "model",
      label: "Model",
      type: CategoryFieldType.TEXT,
      required: true,
      order: 2,
    },
    {
      key: "year",
      label: "Year",
      type: CategoryFieldType.NUMBER,
      required: true,
      order: 3,
    },
    {
      key: "km",
      label: "Kilometers",
      type: CategoryFieldType.NUMBER,
      required: true,
      order: 4,
    },
    {
      key: "fuel",
      label: "Fuel",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["Petrol", "Diesel", "Hybrid", "Electric"]),
      required: true,
      order: 5,
    },
    {
      key: "transmission",
      label: "Transmission",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["Manual", "Automatic"]),
      required: true,
      order: 6,
    },
  ],
  "real-estate": [
    {
      key: "sqm",
      label: "Square meters",
      type: CategoryFieldType.NUMBER,
      required: true,
      order: 1,
    },
    {
      key: "rooms",
      label: "Rooms",
      type: CategoryFieldType.NUMBER,
      required: true,
      order: 2,
    },
    {
      key: "floor",
      label: "Floor",
      type: CategoryFieldType.NUMBER,
      required: false,
      order: 3,
    },
    {
      key: "furnished",
      label: "Furnished",
      type: CategoryFieldType.BOOLEAN,
      required: true,
      order: 4,
    },
    {
      key: "heating",
      label: "Heating",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["Central", "Electric", "Wood", "Gas"]),
      required: false,
      order: 5,
    },
  ],
  jobs: [
    {
      key: "company",
      label: "Company",
      type: CategoryFieldType.TEXT,
      required: true,
      order: 1,
    },
    {
      key: "position",
      label: "Position",
      type: CategoryFieldType.TEXT,
      required: true,
      order: 2,
    },
    {
      key: "salary",
      label: "Salary",
      type: CategoryFieldType.NUMBER,
      required: false,
      order: 3,
    },
    {
      key: "remote",
      label: "Remote",
      type: CategoryFieldType.BOOLEAN,
      required: true,
      order: 4,
    },
    {
      key: "contract",
      label: "Contract",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify([
        "Full-time",
        "Part-time",
        "Contract",
        "Internship",
      ]),
      required: true,
      order: 5,
    },
  ],
  phones: [
    {
      key: "brand",
      label: "Brand",
      type: CategoryFieldType.TEXT,
      required: true,
      order: 1,
    },
    {
      key: "model",
      label: "Model",
      type: CategoryFieldType.TEXT,
      required: true,
      order: 2,
    },
    {
      key: "storage",
      label: "Storage",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["64GB", "128GB", "256GB", "512GB"]),
      required: true,
      order: 3,
    },
    {
      key: "condition",
      label: "Phone Condition",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["New", "Used", "Refurbished"]),
      required: true,
      order: 4,
    },
    {
      key: "warranty",
      label: "Warranty",
      type: CategoryFieldType.BOOLEAN,
      required: false,
      order: 5,
    },
  ],
  electronics: [
    {
      key: "brand",
      label: "Brand",
      type: CategoryFieldType.TEXT,
      required: true,
      order: 1,
    },
    {
      key: "model",
      label: "Model",
      type: CategoryFieldType.TEXT,
      required: true,
      order: 2,
    },
    {
      key: "specs",
      label: "Specs",
      type: CategoryFieldType.TEXT,
      required: false,
      order: 3,
    },
  ],
  services: [
    {
      key: "serviceType",
      label: "Service type",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify([
        "Repair",
        "Cleaning",
        "Consulting",
        "Transport",
      ]),
      required: true,
      order: 1,
    },
    {
      key: "availability",
      label: "Availability",
      type: CategoryFieldType.TEXT,
      required: false,
      order: 2,
    },
  ],
  furniture: [
    {
      key: "material",
      label: "Material",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["Wood", "Metal", "Plastic", "Glass"]),
      required: true,
      order: 1,
    },
    {
      key: "dimensions",
      label: "Dimensions",
      type: CategoryFieldType.TEXT,
      required: false,
      order: 2,
    },
    {
      key: "color",
      label: "Color",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["White", "Black", "Brown", "Gray"]),
      required: false,
      order: 3,
    },
  ],
  fashion: [
    {
      key: "size",
      label: "Size",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["XS", "S", "M", "L", "XL"]),
      required: true,
      order: 1,
    },
    {
      key: "brand",
      label: "Brand",
      type: CategoryFieldType.TEXT,
      required: false,
      order: 2,
    },
    {
      key: "color",
      label: "Color",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["Black", "White", "Blue", "Red", "Green"]),
      required: false,
      order: 3,
    },
  ],
};

const cities = [
  "Skopje",
  "Bitola",
  "Kumanovo",
  "Prilep",
  "Tetovo",
  "Veles",
  "Stip",
  "Ohrid",
  "Gostivar",
  "Strumica",
  "Kavadarci",
  "Kocani",
  "Kicevo",
  "Struga",
  "Gevgelija",
];

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

async function main() {
  console.log("🌱 Seeding...");

  // Categories
  const upsertedCategories = await Promise.all(
    categories.map(([name, slug]) =>
      prisma.category.upsert({
        where: { slug },
        update: { name, isActive: true },
        create: { name, slug, isActive: true },
      }),
    ),
  );
  console.log("✅ Categories:", upsertedCategories.length);

  // Templates
  let templateCount = 0;
  for (const category of upsertedCategories) {
    const templates = templatesByCategorySlug[category.slug] || [];
    for (const t of templates) {
      await prisma.categoryFieldTemplate.upsert({
        where: { categoryId_key: { categoryId: category.id, key: t.key } },
        update: {
          label: t.label,
          type: t.type,
          optionsJson: t.optionsJson ?? null,
          required: t.required ?? false,
          order: t.order ?? 0,
          isActive: true,
        },
        create: {
          categoryId: category.id,
          key: t.key,
          label: t.label,
          type: t.type,
          optionsJson: t.optionsJson ?? null,
          required: t.required ?? false,
          order: t.order ?? 0,
          isActive: true,
        },
      });
      templateCount++;
    }
  }
  console.log("✅ Templates:", templateCount);

  // Cities
  await Promise.all(
    cities.map((city) =>
      prisma.city.upsert({
        where: { slug: slugify(city) },
        update: { name: city },
        create: { name: city, slug: slugify(city) },
      }),
    ),
  );
  console.log("✅ Cities:", cities.length);

  // Admin bootstrap
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  if (adminEmail) {
    await prisma.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: { role: Role.ADMIN },
      create: { email: adminEmail.toLowerCase(), role: Role.ADMIN },
    });
    console.log("✅ Admin:", adminEmail.toLowerCase());
  }

  console.log("🌱 Done.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
