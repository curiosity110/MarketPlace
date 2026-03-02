import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

export default async function DebugTenantPage() {
  const user = await requireUser();

  if (shouldSkipPrismaCalls()) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Tenant debug</h1>
        <p className="text-sm text-muted-foreground">
          Database is temporarily unavailable.
        </p>
      </div>
    );
  }

  let dbUnavailable = false;
  let listingCount = 0;
  let categoryCount = 0;
  let listings: Array<{
    id: string;
    title: string;
    ownerId: string;
    sellerId: string;
    status: string;
    createdAt: Date;
  }> = [];
  let categories: Array<{
    id: string;
    name: string;
    slug: string;
    ownerId: string | null;
  }> = [];

  try {
    [listingCount, categoryCount, listings, categories] = await Promise.all([
      prisma.listing.count({
        where: { ownerId: user.authUserId },
      }),
      prisma.category.count({
        where: { ownerId: user.authUserId },
      }),
      prisma.listing.findMany({
        where: { ownerId: user.authUserId },
        select: {
          id: true,
          title: true,
          ownerId: true,
          sellerId: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.category.findMany({
        where: { ownerId: user.authUserId },
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    markPrismaHealthy();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      dbUnavailable = true;
    } else {
      throw error;
    }
  }

  if (dbUnavailable) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Tenant debug</h1>
        <p className="text-sm text-muted-foreground">
          Database is temporarily unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tenant debug</h1>
      <div className="rounded-xl border border-border/70 bg-card p-4 text-sm">
        <p>
          <strong>User ID (local):</strong> {user.id}
        </p>
        <p>
          <strong>User ID (supabase):</strong> {user.authUserId}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Listings (ownerId):</strong> {listingCount}
        </p>
        <p>
          <strong>Categories (ownerId):</strong> {categoryCount}
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4">
        <h2 className="text-lg font-semibold">First 5 listings</h2>
        <pre className="mt-2 overflow-x-auto text-xs">
          {JSON.stringify(listings, null, 2)}
        </pre>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4">
        <h2 className="text-lg font-semibold">First 5 categories</h2>
        <pre className="mt-2 overflow-x-auto text-xs">
          {JSON.stringify(categories, null, 2)}
        </pre>
      </div>
    </div>
  );
}
