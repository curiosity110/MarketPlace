"use server";

import { createHash } from "node:crypto";
import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

type ActionLocale = "en" | "mk";

function resolveLocale(raw: string | undefined): ActionLocale {
  return raw === "mk" ? "mk" : "en";
}

function getMessages(locale: ActionLocale) {
  if (locale === "mk") {
    return {
      dbUnavailable: "Базата е привремено недостапна.",
      loginRequired: "Најави се за да зачуваш пребарување.",
      invalid: "Невалидно пребарување.",
      saved: "Пребарувањето е зачувано.",
      updated: "Зачуваното пребарување е ажурирано.",
      deleted: "Зачуваното пребарување е избришано.",
    };
  }

  return {
    dbUnavailable: "Database is temporarily unavailable.",
    loginRequired: "Sign in to save searches.",
    invalid: "Invalid search query.",
    saved: "Search saved.",
    updated: "Saved search updated.",
    deleted: "Saved search deleted.",
  };
}

function normalizeQuery(
  rawQuery: Record<string, string | number | boolean | null | undefined>,
) {
  const normalized = Object.entries(rawQuery)
    .map(([key, value]) => [key.trim(), String(value ?? "").trim()] as const)
    .filter(([key, value]) => key.length > 0 && value.length > 0 && key !== "page")
    .sort(([a], [b]) => a.localeCompare(b));

  return Object.fromEntries(normalized);
}

function hashQuery(queryJson: string) {
  return createHash("sha256").update(queryJson).digest("hex");
}

export async function saveSearch({
  query,
  name,
  locale,
}: {
  query: Record<string, string | number | boolean | null | undefined>;
  name?: string;
  locale?: "en" | "mk";
}) {
  const actionLocale = resolveLocale(locale);
  const text = getMessages(actionLocale);
  const user = await getSessionUser();

  if (!user) {
    return { ok: false, message: text.loginRequired };
  }

  if (shouldSkipPrismaCalls()) {
    return { ok: false, message: text.dbUnavailable };
  }

  const normalizedQuery = normalizeQuery(query);
  if (Object.keys(normalizedQuery).length === 0) {
    return { ok: false, message: text.invalid };
  }

  const queryJson = JSON.stringify(normalizedQuery);
  const queryHash = hashQuery(queryJson);
  const safeName = name?.trim().slice(0, 80) || null;

  try {
    const existing = await prisma.savedSearch.findUnique({
      where: {
        userId_queryHash: {
          userId: user.id,
          queryHash,
        },
      },
      select: { id: true },
    });

    if (existing) {
      if (safeName) {
        await prisma.savedSearch.update({
          where: { id: existing.id },
          data: { name: safeName },
        });
      }
      markPrismaHealthy();

      revalidatePath("/profile");
      revalidatePath("/dashboard");
      revalidatePath("/browse");

      return {
        ok: true,
        created: false,
        message: text.updated,
      };
    }

    await prisma.$transaction([
      prisma.savedSearch.create({
        data: {
          userId: user.id,
          name: safeName,
          queryJson,
          queryHash,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          title: text.saved,
          href: "/browse",
        },
      }),
    ]);
    markPrismaHealthy();

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/browse");
    revalidatePath("/notifications");

    return {
      ok: true,
      created: true,
      message: text.saved,
    };
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return { ok: false, message: text.dbUnavailable };
    }
    throw error;
  }
}

export async function listSavedSearches(options?: { limit?: number }) {
  const user = await getSessionUser();
  if (!user || shouldSkipPrismaCalls()) return [];

  try {
    const rows = await prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      select: {
        id: true,
        name: true,
        queryJson: true,
        createdAt: true,
      },
    });
    markPrismaHealthy();
    return rows;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return [];
    }
    throw error;
  }
}

export async function deleteSavedSearch(id: string) {
  const user = await getSessionUser();
  if (!user || shouldSkipPrismaCalls()) return false;

  const safeId = id.trim();
  if (!safeId) return false;

  try {
    const result = await prisma.savedSearch.deleteMany({
      where: { id: safeId, userId: user.id },
    });
    markPrismaHealthy();

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/browse");

    return result.count > 0;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return false;
    }
    throw error;
  }
}
