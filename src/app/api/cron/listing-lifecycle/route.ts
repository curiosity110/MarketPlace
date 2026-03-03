import { NextResponse } from "next/server";
import { runListingLifecycleMaintenance } from "@/lib/listing-lifecycle";

function readBearerToken(headerValue: string | null) {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  return token?.trim() || null;
}

function isDryRun(request: Request) {
  const url = new URL(request.url);
  const value = url.searchParams.get("dryRun");
  return value === "1" || value === "true";
}

export async function GET(request: Request) {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  const bearerToken = readBearerToken(request.headers.get("authorization"));

  if (!configuredSecret || bearerToken !== configuredSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runListingLifecycleMaintenance({
    deleteExpired: true,
    dryRun: isDryRun(request),
  });

  return NextResponse.json({
    ok: true,
    dryRun: result.dryRun,
    deactivated: result.deactivated,
    deleted: result.deleted,
    storageDeleted: result.storageDeleted,
    storageFailures: result.storageFailures,
  });
}
