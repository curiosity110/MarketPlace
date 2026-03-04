"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { FEATURE_FLAG_KEYS, type FeatureFlagKey } from "@/lib/feature-flags";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

function assertFeatureFlagKey(key: string): key is FeatureFlagKey {
  return FEATURE_FLAG_KEYS.includes(key as FeatureFlagKey);
}

export async function setFeatureFlag(key: FeatureFlagKey, enabled: boolean) {
  await requireAdmin();

  if (!assertFeatureFlagKey(key)) {
    throw new Error("Invalid feature flag key.");
  }

  if (shouldSkipPrismaCalls()) {
    throw new Error("Database is temporarily unavailable.");
  }

  try {
    const featureFlagDelegate = (
      prisma as unknown as {
        featureFlag: {
          upsert: (args: {
            where: { key: FeatureFlagKey };
            update: { enabled: boolean };
            create: { key: FeatureFlagKey; enabled: boolean };
          }) => Promise<unknown>;
        };
      }
    ).featureFlag;
    await featureFlagDelegate.upsert({
      where: { key },
      update: { enabled },
      create: { key, enabled },
    });
    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      throw new Error("Database is temporarily unavailable.");
    }
    throw error;
  }

  revalidatePath("/admin/labs");
}
