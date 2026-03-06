export function sanitizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 40);
}

export function buildFallbackHandle(email: string) {
  const normalized = sanitizeUsername(email.split("@")[0] || "seller");
  return normalized || "seller";
}

export function toPublicHandle(username: string) {
  return `@${username}`;
}

export function normalizeOptionalText(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function getInitials(source: string) {
  const normalized = source.trim();
  if (!normalized) return "S";
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}
