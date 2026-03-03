import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { getSupabaseAdminStorageContext } from "@/lib/supabase/admin";

const EXPIRED_GRACE_DAYS = 7;
const EXPIRED_GRACE_MS = EXPIRED_GRACE_DAYS * 24 * 60 * 60 * 1000;
const STORAGE_BATCH_SIZE = 100;

type ListingLifecycleOptions = {
  deleteExpired?: boolean;
  dryRun?: boolean;
  now?: Date;
};

type ListingLifecycleResult = {
  dryRun: boolean;
  deactivated: number;
  deleted: number;
  storageDeleted: number;
  storageFailures: number;
};

type StorageCleanupResult = {
  deleted: number;
  failed: boolean;
};

async function deleteStoragePrefixObjects(prefix: string): Promise<StorageCleanupResult> {
  const { context } = getSupabaseAdminStorageContext();
  if (!context) return { deleted: 0, failed: false };

  let deleted = 0;
  let offset = 0;

  while (true) {
    const { data, error } = await context.client.storage
      .from(context.bucket)
      .list(prefix, {
        limit: STORAGE_BATCH_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      console.error("[LIFECYCLE] storage list failed", { prefix, error: error.message });
      return { deleted, failed: true };
    }

    const filePaths = (data ?? [])
      .filter((entry) => Boolean(entry.id))
      .map((entry) => `${prefix}/${entry.name}`);

    if (filePaths.length > 0) {
      const { error: removeError } = await context.client.storage
        .from(context.bucket)
        .remove(filePaths);
      if (removeError) {
        console.error("[LIFECYCLE] storage remove failed", {
          prefix,
          error: removeError.message,
        });
        return { deleted, failed: true };
      }
      deleted += filePaths.length;
    }

    if (!data || data.length < STORAGE_BATCH_SIZE) break;
    offset += data.length;
  }

  return { deleted, failed: false };
}

export async function runListingLifecycleMaintenance(
  options: ListingLifecycleOptions = {},
): Promise<ListingLifecycleResult> {
  if (shouldSkipPrismaCalls()) {
    return {
      dryRun: Boolean(options.dryRun),
      deactivated: 0,
      deleted: 0,
      storageDeleted: 0,
      storageFailures: 0,
    };
  }

  const now = options.now ?? new Date();
  const shouldDeleteExpired = options.deleteExpired ?? false;
  const dryRun = options.dryRun ?? false;
  const graceCutoff = new Date(now.getTime() - EXPIRED_GRACE_MS);

  try {
    if (dryRun) {
      const deactivated = await prisma.listing.count({
        where: {
          status: ListingStatus.ACTIVE,
          activeUntil: { not: null, lte: now },
        },
      });
      const deleted = shouldDeleteExpired
        ? await prisma.listing.count({
            where: {
              status: ListingStatus.INACTIVE,
              activeUntil: { not: null, lte: graceCutoff },
            },
          })
        : 0;

      markPrismaHealthy();
      return {
        dryRun: true,
        deactivated,
        deleted,
        storageDeleted: 0,
        storageFailures: 0,
      };
    }

    const deactivatedResult = await prisma.listing.updateMany({
      where: {
        status: ListingStatus.ACTIVE,
        activeUntil: {
          not: null,
          lte: now,
        },
      },
      data: { status: ListingStatus.INACTIVE },
    });

    let deleted = 0;
    let storageDeleted = 0;
    let storageFailures = 0;

    if (shouldDeleteExpired) {
      const expiredListings = await prisma.listing.findMany({
        where: {
          status: ListingStatus.INACTIVE,
          activeUntil: {
            not: null,
            lte: graceCutoff,
          },
        },
        select: { id: true },
      });

      const deletableIds: string[] = [];
      for (const listing of expiredListings) {
        const cleanup = await deleteStoragePrefixObjects(listing.id);
        storageDeleted += cleanup.deleted;
        if (cleanup.failed) {
          storageFailures += 1;
          continue;
        }
        deletableIds.push(listing.id);
      }

      if (deletableIds.length > 0) {
        const deletedResult = await prisma.listing.deleteMany({
          where: { id: { in: deletableIds } },
        });
        deleted = deletedResult.count;
      }
    }

    markPrismaHealthy();
    return {
      dryRun: false,
      deactivated: deactivatedResult.count,
      deleted,
      storageDeleted,
      storageFailures,
    };
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      return {
        dryRun: Boolean(options.dryRun),
        deactivated: 0,
        deleted: 0,
        storageDeleted: 0,
        storageFailures: 0,
      };
    }
    throw error;
  }
}
