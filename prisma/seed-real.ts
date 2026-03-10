/**
 * Real Macedonian marketplace seed — 40 listings.
 * Nukes all existing listings, then creates cars, electronics, real estate, furniture, fashion, jobs.
 * Run: pnpm seed:real (after prisma:seed + seed:cars).
 */
import {
  Currency,
  ListingCondition,
  ListingStatus,
  PrismaClient,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const CITIES = ["skopje", "bitola", "strumica", "ohrid", "kumanovo"] as const;

type CitySlug = (typeof CITIES)[number];
type CategorySlug = string;

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
  // —— CARS (10) — all MKD, make/model/year/km/fuel filled ——
  {
    title: "BMW 320d 2018",
    description:
      "Well maintained BMW 320d with full service history. Diesel, automatic, low mileage. Ideal for daily commute. No accidents, clean interior.",
    priceCents: 45_000_000, // 450,000 ден
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
    title: "VW Golf 7 2019",
    description:
      "Popular Golf 7 in great condition. Petrol, manual, reliable and economical. Perfect for city and highway. Recently serviced.",
    priceCents: 38_000_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-hatchback",
    citySlug: "bitola",
    carMakeSlug: "volkswagen",
    carModelSlug: "golf",
    carYear: 2019,
    fieldValues: { brand: "Volkswagen", model: "Golf 7", year: "2019", km: "78000", fuel: "Petrol", transmission: "Manual" },
  },
  {
    title: "Audi A4 2017",
    description:
      "Elegant Audi A4 with diesel engine. Comfortable ride, premium interior. One owner, all documents in order.",
    priceCents: 52_000_000,
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
    title: "Mercedes C200 2016",
    description:
      "Mercedes C200 in excellent condition. Full options, leather interior. Perfect for business or family.",
    priceCents: 58_000_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-sedans",
    citySlug: "ohrid",
    carMakeSlug: "mercedes-benz",
    carModelSlug: "c-class",
    carYear: 2016,
    fieldValues: { brand: "Mercedes-Benz", model: "C200", year: "2016", km: "112000", fuel: "Petrol", transmission: "Automatic" },
  },
  {
    title: "Toyota Yaris 2020",
    description:
      "Reliable Toyota Yaris, ideal for city driving. Low fuel consumption, compact, easy to park. Great first car.",
    priceCents: 32_000_000,
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
    title: "Opel Astra 2015",
    description:
      "Spacious Opel Astra hatchback. Good condition, economical engine, plenty of boot space. Suitable for family.",
    priceCents: 22_000_000,
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
    title: "Ford Focus 2017",
    description:
      "Ford Focus diesel, great fuel economy. Comfortable seats, good handling. Ideal for long trips and daily use.",
    priceCents: 26_000_000,
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
    title: "Renault Clio 2019",
    description:
      "Renault Clio in very good condition. Low running costs, agile in traffic. Perfect for urban driving.",
    priceCents: 29_000_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-hatchback",
    citySlug: "bitola",
    carMakeSlug: "renault",
    carModelSlug: "clio",
    carYear: 2019,
    fieldValues: { brand: "Renault", model: "Clio", year: "2019", km: "62000", fuel: "Diesel", transmission: "Manual" },
  },
  {
    title: "Skoda Octavia 2018",
    description:
      "Skoda Octavia combi, spacious and practical. Diesel, automatic. Full service history. Great value.",
    priceCents: 41_000_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-sedans",
    citySlug: "ohrid",
    carMakeSlug: "skoda",
    carModelSlug: "octavia",
    carYear: 2018,
    fieldValues: { brand: "Skoda", model: "Octavia", year: "2018", km: "92000", fuel: "Diesel", transmission: "Automatic" },
  },
  {
    title: "Peugeot 308 2016",
    description:
      "Peugeot 308 hatchback, economical and comfortable. Petrol engine, manual. Well maintained.",
    priceCents: 24_000_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "cars-hatchback",
    citySlug: "strumica",
    carMakeSlug: "peugeot",
    carModelSlug: "308",
    carYear: 2016,
    fieldValues: { brand: "Peugeot", model: "308", year: "2016", km: "128000", fuel: "Petrol", transmission: "Manual" },
  },
  // —— ELECTRONICS (8) — all MKD ——
  {
    title: "iPhone 14 Pro 128GB",
    description:
      "iPhone 14 Pro in excellent condition. Battery health 96%, no scratches. Comes with original box and charger. Unlocked.",
    priceCents: 5_500_000, // 55,000 ден
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "phones-iphone",
    citySlug: "skopje",
    fieldValues: { brand: "Apple", model: "iPhone 14 Pro", storage: "128GB", condition: "Used" },
  },
  {
    title: "MacBook Air M2 256GB",
    description:
      "MacBook Air M2, 8GB RAM, 256GB SSD. Lightly used, perfect for work and study. Original charger included.",
    priceCents: 7_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "electronics-computers",
    citySlug: "skopje",
    fieldValues: { brand: "Apple", model: "MacBook Air M2", specs: "8GB RAM, 256GB SSD" },
  },
  {
    title: "PlayStation 5",
    description:
      "PS5 with two controllers. Like new, rarely used. No issues, runs quietly. Box included.",
    priceCents: 4_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "electronics-gaming",
    citySlug: "bitola",
    fieldValues: { brand: "Sony", model: "PlayStation 5", specs: "2 controllers" },
  },
  {
    title: "Samsung 55\" 4K Smart TV",
    description:
      "Samsung 55 inch 4K UHD Smart TV. Crystal clear picture, built-in streaming apps. Minor use, no dead pixels.",
    priceCents: 3_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "electronics-tv-audio",
    citySlug: "ohrid",
    fieldValues: { brand: "Samsung", model: "55\" 4K Smart TV", specs: "Smart TV, 4K UHD" },
  },
  {
    title: "iPad Pro 11\" 128GB",
    description:
      "iPad Pro 11 inch, 128GB Wi-Fi. Great for work and creativity. Comes with case and charger. Battery excellent.",
    priceCents: 4_800_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "electronics-computers",
    citySlug: "strumica",
    fieldValues: { brand: "Apple", model: "iPad Pro 11\"", specs: "128GB Wi-Fi" },
  },
  {
    title: "Sony WH-1000XM5 Headphones",
    description:
      "Sony WH-1000XM5 noise-cancelling headphones. Like new, original case and cable. Best-in-class sound.",
    priceCents: 1_800_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "electronics-tv-audio",
    citySlug: "skopje",
    fieldValues: { brand: "Sony", model: "WH-1000XM5", specs: "Noise cancelling" },
  },
  {
    title: "Dell Latitude Laptop",
    description:
      "Dell Latitude business laptop, i5, 16GB RAM, 256GB SSD. Reliable for work and study. Good battery life.",
    priceCents: 4_200_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "electronics-computers",
    citySlug: "kumanovo",
    fieldValues: { brand: "Dell", model: "Latitude", specs: "i5, 16GB RAM, 256GB SSD" },
  },
  {
    title: "Nintendo Switch OLED",
    description:
      "Nintendo Switch OLED with dock and Joy-Cons. Rarely used, perfect condition. Includes case and screen protector.",
    priceCents: 2_200_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "electronics-gaming",
    citySlug: "bitola",
    fieldValues: { brand: "Nintendo", model: "Switch OLED", specs: "Dock, Joy-Cons" },
  },
  // —— REAL ESTATE (6) — MKD ——
  {
    title: "2-bedroom apartment Skopje — for rent",
    description:
      "Bright 2-bedroom apartment in Skopje centar. Renovated, quiet building. Close to shops and transport. Available now.",
    priceCents: 2_500_000, // 25,000 ден/month
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-apartments",
    citySlug: "skopje",
    fieldValues: { sqm: "65", rooms: "2", floor: "3", furnished: "true", heating: "Central" },
  },
  {
    title: "Studio Ohrid — for rent",
    description:
      "Furnished studio in Ohrid, walking distance to the lake. Perfect for couple or solo. Long-term rent preferred.",
    priceCents: 1_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-apartments",
    citySlug: "ohrid",
    fieldValues: { sqm: "32", rooms: "1", floor: "2", furnished: "true", heating: "Central" },
  },
  {
    title: "House Bitola — for sale",
    description:
      "Family house in Bitola, 120m² with garden and parking. Three bedrooms, modern kitchen. Ready to move in.",
    priceCents: 280_000_000, // 2,800,000 ден
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-houses",
    citySlug: "bitola",
    fieldValues: { sqm: "120", rooms: "4", floor: "0", furnished: "true", heating: "Central" },
  },
  {
    title: "Apartment Strumica — for sale",
    description:
      "Spacious apartment in Strumica center. Two bedrooms, balcony. Building with elevator. Ideal for family.",
    priceCents: 120_000_000, // 1,200,000 ден
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-apartments",
    citySlug: "strumica",
    fieldValues: { sqm: "78", rooms: "3", floor: "5", furnished: "false", heating: "Central" },
  },
  {
    title: "Office space Skopje — for rent",
    description:
      "Office space in Skopje business district. 80m², parking included. Suitable for small team or startup.",
    priceCents: 4_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-apartments",
    citySlug: "skopje",
    fieldValues: { sqm: "80", rooms: "3", floor: "2", furnished: "false", heating: "Central" },
  },
  {
    title: "Land Ohrid — for sale",
    description:
      "Building plot in Ohrid area. 500m², utilities nearby. Perfect for family house or investment.",
    priceCents: 80_000_000, // 800,000 ден
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "real-estate-land",
    citySlug: "ohrid",
    fieldValues: { sqm: "500", rooms: "0", furnished: "false", heating: "N/A" },
  },
  // —— FURNITURE (6) — MKD ——
  {
    title: "Leather sofa 3-seater",
    description:
      "Quality leather sofa, 3-seater. Dark brown, minimal wear. Comfortable and elegant. Pick up or delivery in Skopje.",
    priceCents: 1_800_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "furniture-living-room",
    citySlug: "skopje",
    fieldValues: { material: "Leather", dimensions: "220x95 cm", color: "Brown" },
  },
  {
    title: "Oak dining table with 4 chairs",
    description:
      "Solid oak dining table with four matching chairs. Sturdy and elegant. Minor surface wear. Pick up only.",
    priceCents: 1_200_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "furniture-living-room",
    citySlug: "bitola",
    fieldValues: { material: "Wood", dimensions: "160x90 cm", color: "Brown" },
  },
  {
    title: "King bed frame with slats",
    description:
      "King size bed frame with wooden slats. Clean, no damage. Dismantles for transport. Mattress not included.",
    priceCents: 1_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "furniture-bedroom",
    citySlug: "ohrid",
    fieldValues: { material: "Wood", dimensions: "180x200 cm", color: "White" },
  },
  {
    title: "Wardrobe 2 doors",
    description:
      "Large 2-door wardrobe. Plenty of storage, good condition. Light oak finish. Assembly possible for extra fee.",
    priceCents: 900_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "furniture-bedroom",
    citySlug: "strumica",
    fieldValues: { material: "Wood", dimensions: "200x220 cm", color: "Brown" },
  },
  {
    title: "Office desk with drawer",
    description:
      "Modern office desk with drawer unit. Black finish, sturdy. Ideal for home office. Minor surface wear.",
    priceCents: 750_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "furniture-office",
    citySlug: "kumanovo",
    fieldValues: { material: "Metal", dimensions: "120x60 cm", color: "Black" },
  },
  {
    title: "Bookshelf 5 shelves",
    description:
      "Tall bookshelf with 5 shelves. Wood effect, stable. Great for books or display. Easy to assemble.",
    priceCents: 450_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "furniture-office",
    citySlug: "skopje",
    fieldValues: { material: "Wood", dimensions: "180x80 cm", color: "Brown" },
  },
  // —— FASHION (5) — MKD ——
  {
    title: "Nike Air Max 270 men's size 43",
    description:
      "Nike Air Max 270 in black and white. Worn a few times, like new. Original box included. No stains or damage.",
    priceCents: 850_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "fashion-shoes",
    citySlug: "skopje",
    fieldValues: { size: "43", brand: "Nike", color: "Black" },
  },
  {
    title: "Leather jacket men's size L",
    description:
      "Genuine leather jacket, classic cut. Brown, size L. High quality, minimal wear. Perfect for autumn and spring.",
    priceCents: 1_200_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "fashion-men",
    citySlug: "bitola",
    fieldValues: { size: "L", brand: "Unknown", color: "Brown" },
  },
  {
    title: "Levi's 501 jeans blue size 32",
    description:
      "Levi's 501 original fit. Dark blue, size 32x32. Gently used, no rips. Classic style, durable cotton.",
    priceCents: 420_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "fashion-men",
    citySlug: "strumica",
    fieldValues: { size: "32", brand: "Levi's", color: "Blue" },
  },
  {
    title: "Adidas hoodie grey size M",
    description:
      "Adidas hoodie, grey, size M. Soft fabric, good condition. Perfect for casual wear or gym.",
    priceCents: 380_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "fashion-men",
    citySlug: "ohrid",
    fieldValues: { size: "M", brand: "Adidas", color: "Gray" },
  },
  {
    title: "Ray-Ban sunglasses",
    description:
      "Ray-Ban classic aviator style. Authentic, minimal wear. Comes with original case. Timeless design.",
    priceCents: 650_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "fashion-men",
    citySlug: "kumanovo",
    fieldValues: { size: "One size", brand: "Ray-Ban", color: "Black" },
  },
  // —— JOBS (5) — MKD monthly ——
  {
    title: "Junior Developer — Skopje",
    description:
      "We are looking for a junior developer with interest in web technologies. Full-time, hybrid possible. Friendly team, growth opportunities.",
    priceCents: 3_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "jobs-it-software",
    citySlug: "skopje",
    fieldValues: { company: "Tech MK", position: "Junior Developer", salary: "35000", remote: "true", contract: "Full-time" },
  },
  {
    title: "Waiter — Ohrid",
    description:
      "Restaurant by the lake hiring waiter/waitress. Seasonal work, possibility to extend. Good English required. Tips included.",
    priceCents: 1_800_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "jobs-sales",
    citySlug: "ohrid",
    fieldValues: { company: "Lake View", position: "Waiter", salary: "18000", remote: "false", contract: "Full-time" },
  },
  {
    title: "Driver — Skopje",
    description:
      "Delivery driver needed for logistics company. Own vehicle or company van. Full-time, fixed salary plus bonuses. B license required.",
    priceCents: 2_200_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "jobs-operations",
    citySlug: "skopje",
    fieldValues: { company: "QuickDeliver", position: "Driver", salary: "22000", remote: "false", contract: "Full-time" },
  },
  {
    title: "Barista — Bitola",
    description:
      "Coffee shop in Bitola looking for barista. Part-time or full-time. Training provided. Friendly atmosphere.",
    priceCents: 1_600_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "jobs-sales",
    citySlug: "bitola",
    fieldValues: { company: "Coffee House", position: "Barista", salary: "16000", remote: "false", contract: "Part-time" },
  },
  {
    title: "Sales Manager — Skopje",
    description:
      "Sales manager for B2B segment. Experience in sales required. Full-time, competitive salary and bonuses. Car allowance.",
    priceCents: 4_500_000,
    currency: Currency.MKD,
    condition: ListingCondition.USED,
    categorySlug: "jobs-sales",
    citySlug: "skopje",
    fieldValues: { company: "Sales Pro MK", position: "Sales Manager", salary: "45000", remote: "false", contract: "Full-time" },
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
  console.log("Seed real: nuking all listings...");
  const deleted = await prisma.listing.deleteMany({});
  console.log(`Deleted ${deleted.count} listings.`);

  const seller = await prisma.user.findFirst({
    where: { role: { in: [Role.SELLER, Role.ADMIN, Role.CEO] }, bannedAt: null },
    select: { id: true, supabaseAuthId: true },
  });
  if (!seller) {
    throw new Error("No seller user. Run: pnpm prisma:seed");
  }

  const cities = await prisma.city.findMany({
    where: { slug: { in: [...CITIES] } },
    select: { id: true, slug: true },
  });
  const cityBySlug = new Map(cities.map((c) => [c.slug, c]));
  if (cities.length === 0) {
    throw new Error("No cities. Run: pnpm prisma:seed");
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

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
      console.warn(`Category "${seed.categorySlug}" not found, skip: ${seed.title}`);
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
        url: `https://picsum.photos/seed/real-${slugify(seed.title).slice(0, 24)}-${created + 1}/1200/900`,
      },
    });
    created += 1;
  }

  console.log(`Created ${created} real listings.`);
  console.log("Seed real: done.");
}

main()
  .catch((e) => {
    console.error("Seed real failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
