import { headers } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export type RateLimitLocale = "en" | "mk";

type HeaderSource = {
  get(name: string): string | null | undefined;
};

type RateLimitInput = {
  action: string;
  key: string;
  limit: number;
  windowMs?: number;
  now?: Date;
  locale?: RateLimitLocale;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export class RateLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitExceededError";
  }
}

function getRateLimitMessage(locale: RateLimitLocale) {
  return locale === "mk" ? "Премногу обиди денес." : "Too many requests today.";
}

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function getIpFromHeaders(source: HeaderSource) {
  const forwarded = source.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = source.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cfIp = source.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  return null;
}

export function getIpHashFromHeaders(source: HeaderSource) {
  const ip = getIpFromHeaders(source);
  return hashValue(ip || "unknown-ip");
}

export async function getIpHashFromServerActionHeaders() {
  const requestHeaders = await headers();
  return getIpHashFromHeaders(requestHeaders);
}

export function buildRateLimitKey(params: { userId?: string | null; ipHash: string }) {
  if (params.userId) return `user:${params.userId}`;
  return `ip:${params.ipHash}`;
}

export async function consumeRateLimit(input: RateLimitInput) {
  const now = input.now || new Date();
  const windowMs = input.windowMs ?? DAY_MS;
  const since = new Date(now.getTime() - windowMs);
  const locale = input.locale ?? "en";

  try {
    await prisma.$transaction(async (tx) => {
      const currentCount = await tx.rateLimitEvent.count({
        where: {
          action: input.action,
          key: input.key,
          createdAt: { gte: since },
        },
      });

      if (currentCount >= input.limit) {
        throw new RateLimitExceededError(getRateLimitMessage(locale));
      }

      await tx.rateLimitEvent.create({
        data: {
          action: input.action,
          key: input.key,
        },
      });
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) throw error;
    throw error;
  }
}
