const COOLDOWN_MS = 60_000;
let blockedUntil = 0;

export function shouldSkipSupabaseCalls() {
  return Date.now() < blockedUntil;
}

export function markSupabaseUnavailable() {
  blockedUntil = Date.now() + COOLDOWN_MS;
}

export function markSupabaseHealthy() {
  blockedUntil = 0;
}
