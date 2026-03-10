import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CAR_DATA: Array<{ make: string; slug: string; models: string[] }> = [
  {
    make: "Volkswagen",
    slug: "volkswagen",
    models: ["Golf", "Passat", "Polo", "Tiguan", "Touareg", "Touran", "T-Roc", "Jetta", "Arteon", "Caddy"],
  },
  {
    make: "Audi",
    slug: "audi",
    models: ["A1", "A3", "A4", "A5", "A6", "A7", "R8", "Q2", "Q3", "Q5", "Q7", "Q8"],
  },
  {
    make: "BMW",
    slug: "bmw",
    models: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X6"],
  },
  {
    make: "Mercedes-Benz",
    slug: "mercedes-benz",
    models: ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "GLA", "GLC", "GLE", "Vito", "Sprinter"],
  },
  {
    make: "Opel",
    slug: "opel",
    models: ["Astra", "Corsa", "Insignia", "Mokka", "Crossland", "Grandland", "Zafira", "Meriva", "Vectra"],
  },
  {
    make: "Ford",
    slug: "ford",
    models: ["Fiesta", "Focus", "Mondeo", "Kuga", "Puma", "EcoSport", "S-Max", "Galaxy", "Transit", "Ranger"],
  },
  {
    make: "Skoda",
    slug: "skoda",
    models: ["Fabia", "Octavia", "Superb", "Kodiaq", "Kamiq", "Karoq", "Rapid", "Scala", "Yeti"],
  },
  {
    make: "SEAT",
    slug: "seat",
    models: ["Ibiza", "Leon", "Ateca", "Arona", "Tarraco", "Alhambra", "Toledo", "Cordoba"],
  },
  {
    make: "Toyota",
    slug: "toyota",
    models: ["Yaris", "Corolla", "Auris", "Avensis", "Camry", "RAV4", "C-HR", "Prius", "Land Cruiser", "Hilux"],
  },
  {
    make: "Honda",
    slug: "honda",
    models: ["Civic", "Accord", "Jazz", "CR-V", "HR-V", "Pilot", "Insight", "City", "FR-V"],
  },
  {
    make: "Hyundai",
    slug: "hyundai",
    models: ["i10", "i20", "i30", "Elantra", "Tucson", "Santa Fe", "Kona", "Bayon", "ix35", "Sonata"],
  },
  {
    make: "Kia",
    slug: "kia",
    models: ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "Stonic", "Niro", "Optima", "Carens"],
  },
  {
    make: "Nissan",
    slug: "nissan",
    models: ["Micra", "Note", "Qashqai", "Juke", "X-Trail", "Navara", "Leaf", "Pulsar", "Primera"],
  },
  {
    make: "Mazda",
    slug: "mazda",
    models: ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-5", "CX-30", "CX-7", "CX-9", "MX-5"],
  },
  {
    make: "Renault",
    slug: "renault",
    models: ["Clio", "Megane", "Laguna", "Talisman", "Captur", "Kadjar", "Scenic", "Kangoo", "Master"],
  },
  {
    make: "Peugeot",
    slug: "peugeot",
    models: ["206", "207", "208", "308", "3008", "5008", "508", "Partner", "Rifter"],
  },
  {
    make: "Citroen",
    slug: "citroen",
    models: ["C1", "C3", "C4", "C5", "C-Elysee", "Berlingo", "DS3", "DS4", "DS5"],
  },
  {
    make: "Fiat",
    slug: "fiat",
    models: ["500", "Panda", "Punto", "Tipo", "Bravo", "Doblo", "Ducato", "Freemont", "Linea"],
  },
  {
    make: "Volvo",
    slug: "volvo",
    models: ["S40", "S60", "S80", "V40", "V60", "V90", "XC40", "XC60", "XC90"],
  },
];

function slugify(value: string) {
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
  for (const entry of CAR_DATA) {
    const make = await prisma.carMake.upsert({
      where: { slug: entry.slug },
      update: {
        name: entry.make,
        isActive: true,
      },
      create: {
        name: entry.make,
        slug: entry.slug,
        isActive: true,
      },
      select: { id: true },
    });

    for (const modelName of entry.models) {
      const modelSlug = slugify(modelName);
      await prisma.carModel.upsert({
        where: {
          makeId_slug: {
            makeId: make.id,
            slug: modelSlug,
          },
        },
        update: {
          name: modelName,
          isActive: true,
        },
        create: {
          makeId: make.id,
          name: modelName,
          slug: modelSlug,
          isActive: true,
        },
      });
    }
  }

  // Keep models table tidy if a model was removed from the seed list.
  const allowedByMake = new Map<string, Set<string>>();
  CAR_DATA.forEach((entry) => {
    allowedByMake.set(entry.slug, new Set(entry.models.map((name) => slugify(name))));
  });

  const makes = await prisma.carMake.findMany({
    select: {
      id: true,
      slug: true,
      models: {
        select: { id: true, slug: true },
      },
    },
  });

  for (const make of makes) {
    const allowed = allowedByMake.get(make.slug);
    if (!allowed) continue;
    const staleModelIds = make.models
      .filter((model) => !allowed.has(model.slug))
      .map((model) => model.id);
    if (staleModelIds.length > 0) {
      await prisma.carModel.updateMany({
        where: { id: { in: staleModelIds } },
        data: { isActive: false },
      });
    }
  }

  const totalMakeCount = await prisma.carMake.count({ where: { isActive: true } });
  const totalModelCount = await prisma.carModel.count({ where: { isActive: true } });
  console.log(`Cars seed complete: ${totalMakeCount} makes, ${totalModelCount} active models.`);
}

main()
  .catch((error) => {
    console.error("seed-cars failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
