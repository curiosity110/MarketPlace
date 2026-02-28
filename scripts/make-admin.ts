import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.ALLOW_MAKE_ADMIN !== "true") {
    throw new Error(
      "Blocked. Set ALLOW_MAKE_ADMIN=true to run this script.",
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    throw new Error("Missing ADMIN_EMAIL environment variable.");
  }

  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    throw new Error(`User not found for email: ${adminEmail}`);
  }

  if (user.role === Role.ADMIN) {
    console.log(`No changes: ${user.email} is already ADMIN.`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email: adminEmail },
    data: { role: Role.ADMIN },
    select: { id: true, email: true, role: true },
  });

  console.log(
    `Success: promoted ${updated.email} (${updated.id}) to role ${updated.role}.`,
  );
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`make-admin failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
