type ErrorLike = {
  code?: string;
  message?: string;
  cause?: unknown;
};

const NETWORK_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ETIMEDOUT",
]);

function asErrorLike(value: unknown): ErrorLike | null {
  if (!value || typeof value !== "object") return null;
  return value as ErrorLike;
}

function collectCodesAndMessages(error: unknown, depth = 0): Array<string> {
  if (depth > 5) return [];
  const errorLike = asErrorLike(error);
  if (!errorLike) return [];

  const values: Array<string> = [];
  if (typeof errorLike.code === "string") values.push(errorLike.code);
  if (typeof errorLike.message === "string") values.push(errorLike.message);
  if (errorLike.cause) {
    values.push(...collectCodesAndMessages(errorLike.cause, depth + 1));
  }
  return values;
}

export function isLikelySupabaseConnectionError(error: unknown) {
  const entries = collectCodesAndMessages(error).map((entry) => entry.toUpperCase());
  return entries.some(
    (entry) =>
      NETWORK_ERROR_CODES.has(entry) ||
      entry.includes("ENOTFOUND") ||
      entry.includes("GETADDRINFO") ||
      entry.includes("FETCH FAILED"),
  );
}

export function getSafeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
