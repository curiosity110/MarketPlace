import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

export type FeatureFlagKey =
  | "labsEnabled"
  | "homeBigCategories"
  | "browseCityMode"
  | "savedSearches";

export const FEATURE_FLAG_KEYS: FeatureFlagKey[] = [
  "labsEnabled",
  "homeBigCategories",
  "browseCityMode",
  "savedSearches",
];

export const DEFAULT_FLAGS: Record<FeatureFlagKey, boolean> = {
  labsEnabled: false,
  homeBigCategories: false,
  browseCityMode: false,
  savedSearches: false,
};

function isFeatureFlagKey(value: string): value is FeatureFlagKey {
  return FEATURE_FLAG_KEYS.includes(value as FeatureFlagKey);
}

export async function getFeatureFlags(): Promise<Record<FeatureFlagKey, boolean>> {
  if (shouldSkipPrismaCalls()) {
    return { ...DEFAULT_FLAGS };
  }

  try {
    const featureFlagDelegate = (
      prisma as unknown as {
        featureFlag: {
          findMany: (args: {
            select: { key: true; enabled: true };
          }) => Promise<Array<{ key: string; enabled: boolean }>>;
        };
      }
    ).featureFlag;
    const rows = await featureFlagDelegate.findMany({
      select: {
        key: true,
        enabled: true,
      },
    });

    const merged: Record<FeatureFlagKey, boolean> = { ...DEFAULT_FLAGS };
    for (const row of rows) {
      if (!isFeatureFlagKey(row.key)) continue;
      merged[row.key] = Boolean(row.enabled);
    }

    markPrismaHealthy();
    return merged;
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return { ...DEFAULT_FLAGS };
    }
    throw error;
  }
}

export function isEnabled(
  flags: Record<FeatureFlagKey, boolean>,
  key: FeatureFlagKey,
) {
  return Boolean(flags[key]);
}
