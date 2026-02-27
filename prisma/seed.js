/* eslint-disable @typescript-eslint/no-require-imports */
const {
  PrismaClient,
  Currency,
  Role,
  CategoryFieldType,
  ListingCondition,
  ListingStatus,
} = require("@prisma/client");

const prisma = new PrismaClient();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const TESTER_EMAIL = (process.env.SEED_TESTER_EMAIL || "tester@marketplace.mkd").toLowerCase();
const TESTER_NAME = process.env.SEED_TESTER_NAME || "Marketplace Tester";
const TESTER_PHONE = process.env.SEED_TESTER_PHONE || "+38970111222";
const RESET_LISTINGS = process.env.SEED_RESET !== "false";
const FAKE_SELLER_COUNT = Math.max(
  0,
  Number.parseInt(process.env.SEED_FAKE_SELLERS || "10", 10) || 10,
);
const FAKE_SELLER_DOMAIN = process.env.SEED_FAKE_SELLER_DOMAIN || "seed.marketplace.mkd";

const fakeSellerNames = [
  "Ana Trajkovska",
  "Marko Petrovski",
  "Elena Stojanova",
  "Nikola Ristevski",
  "Mila Jovanovska",
  "Stefan Georgievski",
  "Sara Dimitrova",
  "Bojan Talevski",
  "Ivana Velkovska",
  "Filip Krstevski",
  "Marija Ilievska",
  "Darko Nikoloski",
];

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
    { key: "brand", label: "Brand", type: CategoryFieldType.TEXT, required: true, order: 1 },
    { key: "model", label: "Model", type: CategoryFieldType.TEXT, required: true, order: 2 },
    { key: "year", label: "Year", type: CategoryFieldType.NUMBER, required: true, order: 3 },
    { key: "km", label: "Kilometers", type: CategoryFieldType.NUMBER, required: true, order: 4 },
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
    { key: "sqm", label: "Square meters", type: CategoryFieldType.NUMBER, required: true, order: 1 },
    { key: "rooms", label: "Rooms", type: CategoryFieldType.NUMBER, required: true, order: 2 },
    { key: "floor", label: "Floor", type: CategoryFieldType.NUMBER, required: false, order: 3 },
    { key: "furnished", label: "Furnished", type: CategoryFieldType.BOOLEAN, required: true, order: 4 },
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
    { key: "company", label: "Company", type: CategoryFieldType.TEXT, required: true, order: 1 },
    { key: "position", label: "Position", type: CategoryFieldType.TEXT, required: true, order: 2 },
    { key: "salary", label: "Salary", type: CategoryFieldType.NUMBER, required: false, order: 3 },
    { key: "remote", label: "Remote", type: CategoryFieldType.BOOLEAN, required: true, order: 4 },
    {
      key: "contract",
      label: "Contract",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["Full-time", "Part-time", "Contract", "Internship"]),
      required: true,
      order: 5,
    },
  ],
  phones: [
    { key: "brand", label: "Brand", type: CategoryFieldType.TEXT, required: true, order: 1 },
    { key: "model", label: "Model", type: CategoryFieldType.TEXT, required: true, order: 2 },
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
    { key: "warranty", label: "Warranty", type: CategoryFieldType.BOOLEAN, required: false, order: 5 },
  ],
  electronics: [
    { key: "brand", label: "Brand", type: CategoryFieldType.TEXT, required: true, order: 1 },
    { key: "model", label: "Model", type: CategoryFieldType.TEXT, required: true, order: 2 },
    { key: "specs", label: "Specs", type: CategoryFieldType.TEXT, required: false, order: 3 },
  ],
  services: [
    {
      key: "serviceType",
      label: "Service type",
      type: CategoryFieldType.SELECT,
      optionsJson: JSON.stringify(["Repair", "Cleaning", "Consulting", "Transport"]),
      required: true,
      order: 1,
    },
    { key: "availability", label: "Availability", type: CategoryFieldType.TEXT, required: false, order: 2 },
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
    { key: "dimensions", label: "Dimensions", type: CategoryFieldType.TEXT, required: false, order: 2 },
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
    { key: "brand", label: "Brand", type: CategoryFieldType.TEXT, required: false, order: 2 },
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

const listingSeedsByCategorySlug = {
  cars: [
    { title: "Volkswagen Golf 7 2016", priceEur: 8200, description: "Well maintained with service history." },
    { title: "BMW 320d 2015", priceEur: 9700, description: "Clean interior, strong engine, low fuel use." },
    { title: "Audi A4 2014", priceEur: 9100, description: "Registered, ready for test drive." },
  ],
  "real-estate": [
    { title: "Apartment in Centar 65m2", priceEur: 78000, description: "Bright apartment near schools and shops." },
    { title: "House in Bitola 120m2", priceEur: 99000, description: "Family house with private yard." },
    { title: "Studio in Karpos", priceEur: 46500, description: "Great for students or rental investment." },
  ],
  electronics: [
    { title: "Gaming Laptop RTX Series", priceEur: 1200, description: "Fast and stable for work and gaming." },
    { title: "4K Smart TV 55 inch", priceEur: 490, description: "Excellent picture and streaming apps." },
    { title: "PlayStation 5 Bundle", priceEur: 520, description: "Console with accessories, tested and clean." },
  ],
  jobs: [
    { title: "Frontend Developer - React", priceEur: 1500, description: "Mid-level role for marketplace features." },
    { title: "Sales Agent - Marketplace", priceEur: 900, description: "Client acquisition and account support." },
    { title: "Delivery Coordinator", priceEur: 750, description: "Coordinate pickup and drop-off schedules." },
  ],
  services: [
    { title: "Home Cleaning Service", priceEur: 35, description: "Reliable cleaning for homes and offices." },
    { title: "Computer Repair", priceEur: 25, description: "Hardware diagnostics and software cleanup." },
    { title: "Furniture Transport", priceEur: 40, description: "Local transport with loading support." },
  ],
  furniture: [
    { title: "Modern Sofa Set", priceEur: 360, description: "Comfortable sofa in very good condition." },
    { title: "Wood Dining Table", priceEur: 220, description: "Solid wood with six chairs included." },
    { title: "Wardrobe 3 Doors", priceEur: 180, description: "Large storage capacity and clean finish." },
  ],
  phones: [
    { title: "iPhone 13 128GB", priceEur: 520, description: "Battery health strong, no repairs." },
    { title: "Samsung Galaxy S22", priceEur: 430, description: "Unlocked device, original accessories." },
    { title: "Xiaomi 13 Lite", priceEur: 280, description: "Smooth performance and clean display." },
  ],
  fashion: [
    { title: "Nike Sneakers", priceEur: 75, description: "Original, lightly used, comfortable fit." },
    { title: "Winter Jacket", priceEur: 65, description: "Warm and clean, ready for daily use." },
    { title: "Formal Shirt Collection", priceEur: 45, description: "Set of quality shirts in top condition." },
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

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function parseOptions(optionsJson) {
  if (!optionsJson) return [];
  try {
    const parsed = JSON.parse(optionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isMissingTableError(error, tableName) {
  return (
    error &&
    typeof error === "object" &&
    error.code === "P2021" &&
    typeof error.meta?.table === "string" &&
    error.meta.table.includes(tableName)
  );
}

function isMissingColumnError(error, columnName) {
  return (
    error &&
    typeof error === "object" &&
    error.code === "P2022" &&
    typeof error.meta?.column === "string" &&
    error.meta.column.includes(columnName)
  );
}

function fieldValueForTemplate(template, listingIndex, categoryName, listingTitle) {
  const options = parseOptions(template.optionsJson);

  if (template.type === CategoryFieldType.SELECT) {
    return options.length > 0
      ? String(options[listingIndex % options.length])
      : `Option ${listingIndex + 1}`;
  }

  if (template.type === CategoryFieldType.BOOLEAN) {
    return listingIndex % 2 === 0 ? "true" : "false";
  }

  if (template.type === CategoryFieldType.NUMBER) {
    if (template.key.toLowerCase().includes("year")) return String(2014 + listingIndex);
    if (template.key.toLowerCase().includes("km")) return String(120000 + listingIndex * 18000);
    if (template.key.toLowerCase().includes("sqm")) return String(45 + listingIndex * 20);
    if (template.key.toLowerCase().includes("salary")) return String(700 + listingIndex * 350);
    if (template.key.toLowerCase().includes("rooms")) return String(2 + listingIndex);
    if (template.key.toLowerCase().includes("floor")) return String(1 + listingIndex);
    return String(10 + listingIndex * 5);
  }

  if (template.key.toLowerCase().includes("brand")) {
    return listingTitle.split(" ")[0];
  }

  if (template.key.toLowerCase().includes("model")) {
    return listingTitle.split(" ").slice(1, 3).join(" ") || `${categoryName} model`;
  }

  return `${template.label} ${listingIndex + 1}`;
}

function buildFakeSellerSeed(index) {
  const name = fakeSellerNames[index % fakeSellerNames.length];
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".");
  const email = `${slug}.${index + 1}@${FAKE_SELLER_DOMAIN}`.toLowerCase();
  const localPhone = String(70000000 + index * 1111).slice(-8).padStart(8, "0");
  const phone = `+389${localPhone}`;
  return { name, email, phone };
}

async function resetListingData() {
  if (!RESET_LISTINGS) {
    console.log("Skipping listing reset (SEED_RESET=false).");
    return;
  }

  console.log("Resetting listing-related seed data...");
  try {
    await prisma.contactRequest.deleteMany({});
  } catch (error) {
    if (!isMissingTableError(error, "ContactRequest")) throw error;
    console.log("Skipping ContactRequest cleanup (table missing, run migrations).");
  }
  await prisma.report.deleteMany({
    where: {
      OR: [{ targetType: "LISTING" }, { listingId: { not: null } }],
    },
  });
  await prisma.listing.deleteMany({});
}

async function ensureTesterUser() {
  try {
    return await prisma.user.upsert({
      where: { email: TESTER_EMAIL },
      update: {
        name: TESTER_NAME,
        phone: TESTER_PHONE,
        role: Role.SELLER,
        bannedAt: null,
      },
      create: {
        email: TESTER_EMAIL,
        name: TESTER_NAME,
        phone: TESTER_PHONE,
        role: Role.SELLER,
      },
    });
  } catch (error) {
    if (!isMissingColumnError(error, "phone")) throw error;

    console.log("Skipping phone field on tester user (column missing, run migrations).");
    return prisma.user.upsert({
      where: { email: TESTER_EMAIL },
      update: {
        name: TESTER_NAME,
        role: Role.SELLER,
        bannedAt: null,
      },
      create: {
        email: TESTER_EMAIL,
        name: TESTER_NAME,
        role: Role.SELLER,
      },
    });
  }
}

async function ensureFakeSellers() {
  const fakeSellers = [];

  for (let index = 0; index < FAKE_SELLER_COUNT; index += 1) {
    const seed = buildFakeSellerSeed(index);
    const fakeSeller = await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        name: seed.name,
        phone: seed.phone,
        role: Role.SELLER,
        bannedAt: null,
      },
      create: {
        email: seed.email,
        name: seed.name,
        phone: seed.phone,
        role: Role.SELLER,
      },
    });

    fakeSellers.push(fakeSeller);
  }

  return fakeSellers;
}

async function main() {
  console.log("Seed start");

  await resetListingData();

  const upsertedCategories = [];
  for (const [name, slug] of categories) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name, isActive: true },
      create: { name, slug, isActive: true },
    });
    upsertedCategories.push(category);
  }
  console.log(`Categories upserted: ${upsertedCategories.length}`);

  let templateCount = 0;
  for (const category of upsertedCategories) {
    const templates = templatesByCategorySlug[category.slug] || [];
    for (const template of templates) {
      await prisma.categoryFieldTemplate.upsert({
        where: { categoryId_key: { categoryId: category.id, key: template.key } },
        update: {
          label: template.label,
          type: template.type,
          optionsJson: template.optionsJson || null,
          required: template.required || false,
          order: template.order || 0,
          isActive: true,
        },
        create: {
          categoryId: category.id,
          key: template.key,
          label: template.label,
          type: template.type,
          optionsJson: template.optionsJson || null,
          required: template.required || false,
          order: template.order || 0,
          isActive: true,
        },
      });
      templateCount += 1;
    }
  }
  console.log(`Templates upserted: ${templateCount}`);

  const upsertedCities = [];
  for (const cityName of cities) {
    const city = await prisma.city.upsert({
      where: { slug: slugify(cityName) },
      update: { name: cityName },
      create: { name: cityName, slug: slugify(cityName) },
    });
    upsertedCities.push(city);
  }
  console.log(`Cities upserted: ${upsertedCities.length}`);

  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  if (adminEmail) {
    await prisma.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: { role: Role.ADMIN },
      create: { email: adminEmail.toLowerCase(), role: Role.ADMIN },
    });
    console.log(`Admin ensured: ${adminEmail.toLowerCase()}`);
  }

  const tester = await ensureTesterUser();
  console.log(`Tester ensured: ${tester.email}`);
  const fakeSellers = await ensureFakeSellers();
  console.log(`Fake sellers ensured: ${fakeSellers.length}`);
  const listingSellers = [tester, ...fakeSellers];

  const templatesByCategoryId = await prisma.categoryFieldTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ categoryId: "asc" }, { order: "asc" }],
  });
  const templateMap = templatesByCategoryId.reduce((acc, template) => {
    if (!acc[template.categoryId]) acc[template.categoryId] = [];
    acc[template.categoryId].push(template);
    return acc;
  }, {});

  let listingCount = 0;
  for (let categoryIndex = 0; categoryIndex < upsertedCategories.length; categoryIndex += 1) {
    const category = upsertedCategories[categoryIndex];
    const categorySeeds =
      listingSeedsByCategorySlug[category.slug] || [
        {
          title: `${category.name} Listing 1`,
          priceEur: 100,
          description: `Sample ${category.name} listing from tester account.`,
        },
        {
          title: `${category.name} Listing 2`,
          priceEur: 150,
          description: `Second sample ${category.name} listing from tester account.`,
        },
      ];

    for (let listingIndex = 0; listingIndex < categorySeeds.length; listingIndex += 1) {
      const seed = categorySeeds[listingIndex];
      const city = upsertedCities[(categoryIndex + listingIndex) % upsertedCities.length];
      const conditions = [
        ListingCondition.USED,
        ListingCondition.NEW,
        ListingCondition.REFURBISHED,
      ];
      const condition = conditions[(categoryIndex + listingIndex) % conditions.length];
      const currency =
        (categoryIndex + listingIndex) % 2 === 0 ? Currency.MKD : Currency.EUR;
      const normalizedPrice =
        currency === Currency.MKD
          ? Math.round(seed.priceEur * 61.5)
          : seed.priceEur;

      const seller = listingSellers[(categoryIndex + listingIndex) % listingSellers.length];
      const listing = await prisma.listing.create({
        data: {
          sellerId: seller.id,
          title: seed.title,
          description: seed.description,
          priceCents: Math.round(normalizedPrice * 100),
          currency,
          categoryId: category.id,
          cityId: city.id,
          condition,
          status: ListingStatus.ACTIVE,
          activeUntil: new Date(Date.now() + THIRTY_DAYS_MS),
        },
      });

      const templates = templateMap[category.id] || [];
      const fieldValues = templates
        .map((template) => ({
          listingId: listing.id,
          key: template.key,
          value: fieldValueForTemplate(
            template,
            listingIndex,
            category.name,
            seed.title,
          ),
        }))
        .filter((entry) => String(entry.value || "").trim().length > 0);

      if (fieldValues.length > 0) {
        await prisma.listingFieldValue.createMany({ data: fieldValues });
      }

      await prisma.listingImage.create({
        data: {
          listingId: listing.id,
          url: `https://picsum.photos/seed/${category.slug}-${listingIndex + 1}/1200/900`,
        },
      });

      listingCount += 1;
    }
  }

  console.log(`Listings seeded: ${listingCount}`);
  console.log("Seed finished");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
