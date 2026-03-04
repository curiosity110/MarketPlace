"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

export async function listNotifications(options?: { limit?: number }) {
  const user = await getSessionUser();
  if (!user || shouldSkipPrismaCalls()) {
    return {
      items: [],
      unreadCount: 0,
    };
  }

  try {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 12,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          href: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { userId: user.id, readAt: null },
      }),
    ]);
    markPrismaHealthy();
    return { items, unreadCount };
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return { items: [], unreadCount: 0 };
    }
    throw error;
  }
}

export async function markNotificationRead(id: string) {
  const user = await getSessionUser();
  if (!user || shouldSkipPrismaCalls()) return false;

  const safeId = id.trim();
  if (!safeId) return false;

  try {
    const result = await prisma.notification.updateMany({
      where: {
        id: safeId,
        userId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    markPrismaHealthy();
    revalidatePath("/notifications");
    return result.count > 0;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return false;
    }
    throw error;
  }
}

export async function markAllRead() {
  const user = await getSessionUser();
  if (!user || shouldSkipPrismaCalls()) return false;

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    markPrismaHealthy();
    revalidatePath("/notifications");
    return true;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return false;
    }
    throw error;
  }
}
