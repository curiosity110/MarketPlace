const COOLDOWN_MS = 60_000;
let blockedUntil = 0;

export function shouldSkipPrismaCalls() {
  return Date.now() < blockedUntil;
}

export function markPrismaUnavailable() {
  blockedUntil = Date.now() + COOLDOWN_MS;
}

export function markPrismaHealthy() {
  blockedUntil = 0;
}
