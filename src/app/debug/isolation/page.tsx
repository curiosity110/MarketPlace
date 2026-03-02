import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

export default async function DebugIsolationPage() {
  const sessionUser = await requireUser();

  if (shouldSkipPrismaCalls()) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Isolation debug</h1>
        <p className="text-sm text-muted-foreground">
          Database is temporarily unavailable.
        </p>
      </div>
    );
  }

  let dbUnavailable = false;
  let profileRow: {
    id: string;
    email: string;
    supabaseAuthId: string | null;
    name: string | null;
    username: string | null;
  } | null = null;
  let listingCount = 0;
  let categoryCount = 0;
  let firstListing: {
    id: string;
    ownerId: string;
    title: string;
    status: string;
  } | null = null;

  try {
    [profileRow, listingCount, categoryCount, firstListing] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          email: true,
          supabaseAuthId: true,
          name: true,
          username: true,
        },
      }),
      prisma.listing.count({
        where: { ownerId: sessionUser.authUserId },
      }),
      prisma.category.count({
        where: { ownerId: sessionUser.authUserId },
      }),
      prisma.listing.findFirst({
        where: { ownerId: sessionUser.authUserId },
        orderBy: { createdAt: "desc" },
        select: { id: true, ownerId: true, title: true, status: true },
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
        <h1 className="text-2xl font-bold">Isolation debug</h1>
        <p className="text-sm text-muted-foreground">
          Database is temporarily unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Isolation debug</h1>

      <div className="rounded-xl border border-border/70 bg-card p-4 text-sm">
        <p>
          <strong>Session email:</strong> {sessionUser.email}
        </p>
        <p>
          <strong>Session local user.id:</strong> {sessionUser.id}
        </p>
        <p>
          <strong>Session supabase uid:</strong> {sessionUser.authUserId}
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 text-sm">
        <p className="font-semibold">Loaded profile row</p>
        <pre className="mt-2 overflow-x-auto text-xs">
          {JSON.stringify(profileRow, null, 2)}
        </pre>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 text-sm">
        <p>
          <strong>User-owned listings count:</strong> {listingCount}
        </p>
        <p>
          <strong>User-owned categories count:</strong> {categoryCount}
        </p>
        <p className="mt-2 font-semibold">First user-owned listing</p>
        <pre className="mt-2 overflow-x-auto text-xs">
          {JSON.stringify(firstListing, null, 2)}
        </pre>
      </div>
    </div>
  );
}
