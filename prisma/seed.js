const { PrismaClient, Role } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  ["Vehicles", "vehicles"],
  ["Real Estate", "real-estate"],
  ["Electronics", "electronics"],
  ["Home & Garden", "home-garden"],
  ["Fashion", "fashion"],
  ["Jobs", "jobs"],
  ["Services", "services"],
];

const cities = ["Skopje","Bitola","Kumanovo","Prilep","Tetovo","Veles","Stip","Ohrid","Gostivar","Strumica","Kavadarci","Kocani","Kicevo","Struga","Gevgelija"];

const slugify = (value) => value.toLowerCase().normalize('NFD').replace(/[^a-z\s-]/g, '').trim().replace(/\s+/g, '-');

async function main() {
  await Promise.all(categories.map(([name, slug]) => prisma.category.upsert({ where: { slug }, update: { name }, create: { name, slug } })));
  await Promise.all(cities.map((city) => prisma.city.upsert({ where: { slug: slugify(city) }, update: { name: city }, create: { name: city, slug: slugify(city) } })));

  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  if (adminEmail) {
    await prisma.user.upsert({ where: { email: adminEmail.toLowerCase() }, update: { role: Role.ADMIN }, create: { email: adminEmail.toLowerCase(), role: Role.ADMIN } });
  }
}

main().finally(() => prisma.$disconnect());
