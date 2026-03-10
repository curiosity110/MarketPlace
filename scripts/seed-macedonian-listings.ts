import {
  Currency,
  ListingCondition,
  ListingStatus,
  PrismaClient,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Delete all existing listings so we only have the new 30 realistic ones (removes test/junk like "asdasdasdasd", "ASADSAD", "MOHOOO"). */
async function deleteAllListings() {
  const result = await prisma.listing.deleteMany({});
  console.log(`Deleted ${result.count} existing listings.`);
}

type CitySlug = string;
type CategorySlug = string;

const CITIES: CitySlug[] = ["skopje", "bitola", "strumica", "ohrid", "kumanovo"];

interface ListingSeed {
  title: string;
  description: string;
  priceCents: number;
  currency: Currency;
  condition: ListingCondition;
  categorySlug: CategorySlug;
  citySlug: CitySlug;
  carMakeSlug?: string;
  carModelSlug?: string;
  carYear?: number;
  fieldValues?: Record<string, string>;
}

const LISTINGS: ListingSeed[] = [
  // —— 8 Cars (MKD 200,000–900,000) ——
  {
    title: "BMW 320d 2018",
    description:
      "Well maintained BMW 320d with full service history. Diesel, automatic transmission, low mileage. Ideal for daily commute or longer trips. No accidents, clean interior.",
    priceCents: 45_000_000, // 450,000 MKD
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-sedans",
    citySlug: "skopje",
    carMakeSlug: "bmw",
    carModelSlug: "3-series",
    carYear: 2018,
    fieldValues: { brand: "BMW", model: "320d", year: "2018", km: "95000", fuel: "Diesel", transmission: "Automatic" },
  },
  {
    title: "Volkswagen Golf 7 2016",
    description:
      "Popular Golf 7 in great condition. Petrol engine, manual gearbox, reliable and economical. Perfect for city and highway. Recently serviced.",
    priceCents: 32_000_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-hatchback",
    citySlug: "bitola",
    carMakeSlug: "volkswagen",
    carModelSlug: "golf",
    carYear: 2016,
    fieldValues: { brand: "Volkswagen", model: "Golf 7", year: "2016", km: "120000", fuel: "Petrol", transmission: "Manual" },
  },
  {
    title: "Audi A4 2.0 TDI 2017",
    description:
      "Elegant Audi A4 with diesel engine. Comfortable ride, premium interior, excellent build quality. One owner, all documents in order.",
    priceCents: 58_000_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-sedans",
    citySlug: "skopje",
    carMakeSlug: "audi",
    carModelSlug: "a4",
    carYear: 2017,
    fieldValues: { brand: "Audi", model: "A4", year: "2017", km: "88000", fuel: "Diesel", transmission: "Automatic" },
  },
  {
    title: "Mercedes-Benz C200 2019",
    description:
      "Mercedes C200 in excellent condition. Low mileage, full options, leather interior. Perfect for business or family. All services done at authorized dealer.",
    priceCents: 89_000_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-sedans",
    citySlug: "ohrid",
    carMakeSlug: "mercedes-benz",
    carModelSlug: "c-class",
    carYear: 2019,
    fieldValues: { brand: "Mercedes-Benz", model: "C200", year: "2019", km: "52000", fuel: "Petrol", transmission: "Automatic" },
  },
  {
    title: "Toyota Yaris 2020",
    description:
      "Reliable Toyota Yaris, ideal for city driving. Low fuel consumption, compact size, easy to park. Great first car or runabout.",
    priceCents: 26_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-hatchback",
    citySlug: "strumica",
    carMakeSlug: "toyota",
    carModelSlug: "yaris",
    carYear: 2020,
    fieldValues: { brand: "Toyota", model: "Yaris", year: "2020", km: "45000", fuel: "Petrol", transmission: "Manual" },
  },
  {
    title: "Opel Astra 1.4 2015",
    description:
      "Spacious Opel Astra hatchback. Good condition, economical engine, plenty of boot space. Suitable for family use.",
    priceCents: 21_000_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-hatchback",
    citySlug: "kumanovo",
    carMakeSlug: "opel",
    carModelSlug: "astra",
    carYear: 2015,
    fieldValues: { brand: "Opel", model: "Astra", year: "2015", km: "145000", fuel: "Petrol", transmission: "Manual" },
  },
  {
    title: "Ford Focus 1.6 TDCi 2017",
    description:
      "Ford Focus diesel, great fuel economy. Comfortable seats, good handling. Ideal for long trips and daily use.",
    priceCents: 29_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-hatchback",
    citySlug: "skopje",
    carMakeSlug: "ford",
    carModelSlug: "focus",
    carYear: 2017,
    fieldValues: { brand: "Ford", model: "Focus", year: "2017", km: "112000", fuel: "Diesel", transmission: "Manual" },
  },
  {
    title: "Renault Clio 1.5 dCi 2018",
    description:
      "Renault Clio in very good condition. Low running costs, agile in traffic. Perfect for urban driving and short trips.",
    priceCents: 23_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-hatchback",
    citySlug: "bitola",
    carMakeSlug: "renault",
    carModelSlug: "clio",
    carYear: 2018,
    fieldValues: { brand: "Renault", model: "Clio", year: "2018", km: "78000", fuel: "Diesel", transmission: "Manual" },
  },
  // —— 6 Electronics ——
  {
    title: "iPhone 14 128GB",
    description:
      "iPhone 14 in excellent condition. Battery health 94%, no scratches on screen. Comes with original box and charger. Unlocked for all carriers.",
    priceCents: 650_00, // EUR
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "phones-iphone",
    citySlug: "skopje",
    fieldValues: { brand: "Apple", model: "iPhone 14", storage: "128GB", condition: "Used", warranty: "false" },
  },
  {
    title: "MacBook Air M2 2022",
    description:
      "MacBook Air with M2 chip, 8GB RAM, 256GB SSD. Lightly used, perfect for students and professionals. Original charger included.",
    priceCents: 950_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "electronics-computers",
    citySlug: "skopje",
    fieldValues: { brand: "Apple", model: "MacBook Air M2", specs: "8GB RAM, 256GB SSD" },
  },
  {
    title: "PlayStation 5 Digital Edition",
    description:
      "PS5 Digital Edition with two controllers. Like new, rarely used. Includes several digital games. No issues, runs quietly.",
    priceCents: 380_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "electronics-gaming",
    citySlug: "bitola",
    fieldValues: { brand: "Sony", model: "PlayStation 5", specs: "Digital Edition, 2 controllers" },
  },
  {
    title: "Samsung 55\" 4K Smart TV",
    description:
      "Samsung 55 inch 4K UHD Smart TV. Crystal clear picture, built-in streaming apps. Wall mount can be included. Minor use, no dead pixels.",
    priceCents: 420_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "electronics-tv-audio",
    citySlug: "ohrid",
    fieldValues: { brand: "Samsung", model: "55\" 4K Smart TV", specs: "Smart TV, 4K UHD" },
  },
  {
    title: "iPad 10th Gen 64GB",
    description:
      "iPad 10th generation, 64GB Wi-Fi. Great for work and entertainment. Comes with case and original charger. Battery in excellent condition.",
    priceCents: 340_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "electronics-computers",
    citySlug: "strumica",
    fieldValues: { brand: "Apple", model: "iPad 10th Gen", specs: "64GB Wi-Fi" },
  },
  {
    title: "Apple AirPods Pro (2nd gen)",
    description:
      "AirPods Pro 2nd generation with active noise cancellation. Like new, rarely used. Original case and box included.",
    priceCents: 195_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "electronics-tv-audio",
    citySlug: "skopje",
    fieldValues: { brand: "Apple", model: "AirPods Pro 2", specs: "Noise cancellation, MagSafe case" },
  },
  // —— 5 Real estate ——
  {
    title: "Apartment in Skopje Centar 72m²",
    description:
      "Bright 3-room apartment in the center of Skopje. Renovated, quiet building, close to shops and public transport. Ideal for family or rental investment.",
    priceCents: 9_500_000, // 95,000 EUR
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-apartments",
    citySlug: "skopje",
    fieldValues: { sqm: "72", rooms: "3", floor: "4", furnished: "true", heating: "Central" },
  },
  {
    title: "Apartment for rent in Ohrid 55m²",
    description:
      "Furnished apartment for rent in Ohrid, walking distance to the lake. Available for long-term rent. Perfect for couple or small family.",
    priceCents: 450_00, // 450 EUR/month
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-apartments",
    citySlug: "ohrid",
    fieldValues: { sqm: "55", rooms: "2", floor: "2", furnished: "true", heating: "Central" },
  },
  {
    title: "Apartment Bitola 65m² for sale",
    description:
      "Spacious apartment in Bitola center. Two bedrooms, large living room, balcony. Building with elevator. Ready to move in.",
    priceCents: 6_200_000,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-apartments",
    citySlug: "bitola",
    fieldValues: { sqm: "65", rooms: "3", floor: "5", furnished: "false", heating: "Central" },
  },
  {
    title: "Studio apartment Skopje Karposh 38m²",
    description:
      "Compact studio in Karposh, ideal for student or young professional. Fully furnished, internet included. Quiet neighborhood.",
    priceCents: 350_00, // 350 EUR/month
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-apartments",
    citySlug: "skopje",
    fieldValues: { sqm: "38", rooms: "1", floor: "3", furnished: "true", heating: "Electric" },
  },
  {
    title: "House for rent Strumica 120m²",
    description:
      "Family house for rent in Strumica. Garden, parking, three bedrooms. Suitable for long-term rental. Pets negotiable.",
    priceCents: 550_00, // 550 EUR/month
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-houses",
    citySlug: "strumica",
    fieldValues: { sqm: "120", rooms: "4", floor: "0", furnished: "true", heating: "Central" },
  },
  // —— 5 Furniture ——
  {
    title: "L-shaped sofa grey fabric",
    description:
      "Large L-shaped sofa in light grey fabric. Very comfortable, minimal wear. Fits living room 4x5m. Can deliver in Skopje area.",
    priceCents: 280_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "furniture-living-room",
    citySlug: "skopje",
    fieldValues: { material: "Fabric", dimensions: "280x180 cm", color: "Gray" },
  },
  {
    title: "Solid wood dining table with 6 chairs",
    description:
      "Dining table made of solid wood with 6 matching chairs. Sturdy and elegant. Minor scratches on table top. Pick up only.",
    priceCents: 320_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "furniture-living-room",
    citySlug: "bitola",
    fieldValues: { material: "Wood", dimensions: "180x90 cm", color: "Brown" },
  },
  {
    title: "Double bed with mattress 160x200",
    description:
      "Double bed frame with quality mattress. Clean, no stains. Dismantles for easy transport. Good condition.",
    priceCents: 180_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "furniture-bedroom",
    citySlug: "ohrid",
    fieldValues: { material: "Wood", dimensions: "160x200 cm", color: "White" },
  },
  {
    title: "Wardrobe 3 doors sliding",
    description:
      "Large sliding door wardrobe, 3 doors. Plenty of storage, good for bedroom or hallway. Light oak finish. Assembly possible for extra fee.",
    priceCents: 220_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "furniture-bedroom",
    citySlug: "skopje",
    fieldValues: { material: "Wood", dimensions: "240x220 cm", color: "Brown" },
  },
  {
    title: "Office desk with drawer unit",
    description:
      "Modern office desk with drawer unit and cable management. Ideal for home office. Black finish, sturdy. Minor surface wear.",
    priceCents: 120_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "furniture-office",
    citySlug: "kumanovo",
    fieldValues: { material: "Metal", dimensions: "120x60 cm", color: "Black" },
  },
  // —— 3 Jobs ——
  {
    title: "Software Developer (React / Node)",
    description:
      "We are looking for a mid-level software developer with experience in React and Node.js. Full-time position, hybrid work possible. Competitive salary and benefits.",
    priceCents: 0,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "jobs-it-software",
    citySlug: "skopje",
    fieldValues: { company: "Tech Solutions MK", position: "Software Developer", salary: "1500", remote: "true", contract: "Full-time" },
  },
  {
    title: "Waiter / Waitress – restaurant in Ohrid",
    description:
      "Restaurant by the lake is hiring a waiter or waitress. Seasonal work, possibility to extend. Good English required. Tips included.",
    priceCents: 0,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "jobs-sales",
    citySlug: "ohrid",
    fieldValues: { company: "Lake View Restaurant", position: "Waiter", salary: "600", remote: "false", contract: "Full-time" },
  },
  {
    title: "Delivery driver – Skopje",
    description:
      "Delivery driver needed for local logistics company. Own vehicle or company van. Full-time, fixed salary plus bonuses. Valid B license required.",
    priceCents: 0,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "jobs-operations",
    citySlug: "skopje",
    fieldValues: { company: "QuickDeliver MK", position: "Driver", salary: "700", remote: "false", contract: "Full-time" },
  },
  // —— 3 Fashion ——
  {
    title: "Nike Air Max 90 men's size 43",
    description:
      "Nike Air Max 90 in black and white. Worn a few times, like new. Original box included. No stains or damage.",
    priceCents: 85_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "fashion-shoes",
    citySlug: "skopje",
    fieldValues: { size: "43", brand: "Nike", color: "Black" },
  },
  {
    title: "Leather jacket men's size L",
    description:
      "Genuine leather jacket, classic cut. Brown color, size L. High quality, minimal wear. Perfect for autumn and spring.",
    priceCents: 95_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "fashion-men",
    citySlug: "bitola",
    fieldValues: { size: "L", brand: "Unknown", color: "Brown" },
  },
  {
    title: "Levi's 501 jeans blue size 32/32",
    description:
      "Levi's 501 original fit jeans. Dark blue, size 32x32. Gently used, no rips. Classic style, durable cotton.",
    priceCents: 45_00,
    currency: Currency.EUR,
    condition: ListingCondition.USED,
    categorySlug: "fashion-men",
    citySlug: "strumica",
    fieldValues: { size: "32", brand: "Levi's", color: "Blue" },
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  console.log("Seed Macedonian listings: start");

  await deleteAllListings();

  const seller = await prisma.user.findFirst({
    where: { role: { in: [Role.SELLER, Role.ADMIN, Role.CEO] }, bannedAt: null },
    select: { id: true, supabaseAuthId: true },
  });
  if (!seller) {
    throw new Error("No seller user found. Run the main seed first: pnpm prisma:seed");
  }

  const cities = await prisma.city.findMany({
    where: { slug: { in: CITIES } },
    select: { id: true, slug: true },
  });
  const cityBySlug = new Map(cities.map((c) => [c.slug, c]));
  if (cities.length === 0) {
    throw new Error("No cities found. Run the main seed first: pnpm prisma:seed");
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  if (categories.length === 0) {
    throw new Error("No categories found. Run the main seed first: pnpm prisma:seed");
  }

  const carMakes = await prisma.carMake.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, models: { where: { isActive: true }, select: { id: true, slug: true } } },
  });
  const makeBySlug = new Map(carMakes.map((m) => [m.slug, m]));
  const getCarModelId = (makeSlug: string, modelSlug: string): string | null => {
    const make = makeBySlug.get(makeSlug);
    if (!make) return null;
    const model = make.models.find((m) => m.slug === modelSlug);
    return model?.id ?? null;
  };
  const getCarMakeId = (makeSlug: string): string | null => makeBySlug.get(makeSlug)?.id ?? null;

  const now = Date.now();
  let created = 0;

  for (const seed of LISTINGS) {
    const city = cityBySlug.get(seed.citySlug) ?? cities[created % cities.length];
    const category = categoryBySlug.get(seed.categorySlug);
    if (!category) {
      console.warn(`Category slug "${seed.categorySlug}" not found, skipping listing: ${seed.title}`);
      continue;
    }

    let carMakeId: string | null = null;
    let carModelId: string | null = null;
    if (seed.carMakeSlug && seed.carModelSlug) {
      carMakeId = getCarMakeId(seed.carMakeSlug) ?? null;
      carModelId = getCarModelId(seed.carMakeSlug, seed.carModelSlug) ?? null;
    }

    const listing = await prisma.listing.create({
      data: {
        ownerId: seller.supabaseAuthId ?? seller.id,
        sellerId: seller.id,
        title: seed.title,
        description: seed.description,
        priceCents: seed.priceCents,
        currency: seed.currency,
        categoryId: category.id,
        cityId: city.id,
        condition: seed.condition,
        status: ListingStatus.ACTIVE,
        activeUntil: new Date(now + THIRTY_DAYS_MS),
        carMakeId: carMakeId ?? undefined,
        carModelId: carModelId ?? undefined,
        carYear: seed.carYear ?? undefined,
      },
      select: { id: true },
    });

    if (seed.fieldValues && Object.keys(seed.fieldValues).length > 0) {
      const templates = await prisma.categoryFieldTemplate.findMany({
        where: { categoryId: category.id, isActive: true },
        select: { key: true },
      });
      const templateKeys = new Set(templates.map((t) => t.key));
      const values = Object.entries(seed.fieldValues)
        .filter(([, v]) => v != null && String(v).trim() !== "")
        .filter(([k]) => templateKeys.has(k))
        .map(([key, value]) => ({ listingId: listing.id, key, value: String(value) }));
      if (values.length > 0) {
        await prisma.listingFieldValue.createMany({ data: values });
      }
    }

    await prisma.listingImage.create({
      data: {
        listingId: listing.id,
        url: `https://picsum.photos/seed/mk-${slugify(seed.title).slice(0, 20)}-${created + 1}/1200/900`,
      },
    });

    created += 1;
  }

  console.log(`Created ${created} Macedonian marketplace listings.`);
  console.log("Seed Macedonian listings: finished.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
