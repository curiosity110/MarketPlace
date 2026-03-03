import { Prisma } from "@prisma/client";

function stringMetaField(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === "string" ? value : "";
}

export function isMissingCategoryRequestTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code !== "P2021" && error.code !== "P2022") return false;
    const table = stringMetaField(error.meta, "table");
    const column = stringMetaField(error.meta, "column");

    return (
      table.includes("CategoryRequest") ||
      column.includes("CategoryRequest") ||
      error.message.includes("CategoryRequest")
    );
  }

  return error instanceof Error && error.message.includes("CategoryRequest");
}

const PRISMA_CONNECTION_ERROR_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Connection timed out
  "P1017", // Server has closed the connection
  "P2024", // Timed out fetching a connection from the pool
]);

const PRISMA_CONNECTION_ERROR_PATTERNS = [
  "can't reach database server",
  "connection timed out",
  "server has closed the connection",
  "timed out fetching a new connection from the connection pool",
  "too many connections",
  "too many clients",
  "max clients reached",
  "maxclientsinsessionmode",
  "remaining connection slots are reserved",
  "error querying the database: fatal",
];

function hasConnectionErrorMessage(message: string) {
  const lower = message.toLowerCase();
  return PRISMA_CONNECTION_ERROR_PATTERNS.some((pattern) =>
    lower.includes(pattern),
  );
}

export function isPrismaConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (PRISMA_CONNECTION_ERROR_CODES.has(error.code)) return true;
    return hasConnectionErrorMessage(error.message);
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return hasConnectionErrorMessage(error.message);
  }

  return (
    error instanceof Error &&
    hasConnectionErrorMessage(error.message)
  );
}
