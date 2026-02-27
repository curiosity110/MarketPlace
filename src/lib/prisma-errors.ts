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
]);

export function isPrismaConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (PRISMA_CONNECTION_ERROR_CODES.has(error.code)) return true;
    return error.message.includes("Can't reach database server");
  }

  return (
    error instanceof Error &&
    (error.message.includes("Can't reach database server") ||
      error.message.includes("Connection timed out"))
  );
}
