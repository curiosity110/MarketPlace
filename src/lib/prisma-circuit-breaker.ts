const COOLDOWN_MS = 60_000;
let blockedUntil = 0;
const FORCE_SKIP_PRISMA =
  process.env.SKIP_PRISMA_CALLS === "1" ||
  process.env.DISABLE_DB === "1" ||
  !process.env.DATABASE_URL;

export function shouldSkipPrismaCalls() {
  if (FORCE_SKIP_PRISMA) return true;
  return Date.now() < blockedUntil;
}

export function markPrismaUnavailable() {
  blockedUntil = Date.now() + COOLDOWN_MS;
}

export function markPrismaHealthy() {
  blockedUntil = 0;
}
