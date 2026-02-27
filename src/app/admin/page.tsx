import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { isMissingCategoryRequestTableError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function monthKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short" });
}

async function reviewCategoryRequest(formData: FormData) {
  "use server";

  await requireAdmin();
  const requestId = String(formData.get("requestId") || "");
  const decision = String(formData.get("decision") || "");
  const adminNotes = String(formData.get("adminNotes") || "").trim();

  let request: Awaited<ReturnType<typeof prisma.categoryRequest.findUnique>> | null = null;
  try {
    request = await prisma.categoryRequest.findUnique({ where: { id: requestId } });
  } catch (error) {
    if (isMissingCategoryRequestTableError(error)) return;
    throw error;
  }

  if (!request || request.status !== "PENDING") return;

  if (decision === "approve") {
    const baseSlug = slugify(request.desiredName);
    let nextSlug = baseSlug || `category-${Date.now()}`;
    let index = 1;

    while (await prisma.category.findUnique({ where: { slug: nextSlug } })) {
      nextSlug = `${baseSlug}-${index++}`;
    }

    try {
      await prisma.$transaction([
        prisma.category.create({
          data: {
            name: request.desiredName,
            slug: nextSlug,
            parentId: request.parentId || null,
            isActive: true,
          },
        }),
        prisma.categoryRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            adminNotes: adminNotes || "Approved by admin",
          },
        }),
      ]);
    } catch (error) {
      if (isMissingCategoryRequestTableError(error)) return;
      throw error;
    }
  } else if (decision === "reject") {
    try {
      await prisma.categoryRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", adminNotes: adminNotes || "Rejected by admin" },
      });
    } catch (error) {
      if (isMissingCategoryRequestTableError(error)) return;
      throw error;
    }
  }

  revalidatePath("/admin");
  revalidatePath("/categories");
  revalidatePath("/sell");
}

export default async function AdminPage() {
  await requireAdmin();

  const trendStartDate = new Date();
  trendStartDate.setUTCMonth(trendStartDate.getUTCMonth() - 5);
  trendStartDate.setUTCDate(1);
  trendStartDate.setUTCHours(0, 0, 0, 0);

  const [
    openReports,
    actions,
    pendingRequests,
    activeListingsCount,
    totalUsers,
    activeSellerRows,
    recentUsers,
    recentListings,
    recentReports,
  ] = await Promise.all([
    prisma.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true, sellerId: true } },
      },
    }),
    prisma.adminAction.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    (async () => {
      try {
        return await prisma.categoryRequest.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "asc" },
        });
      } catch (error) {
        if (isMissingCategoryRequestTableError(error)) return [];
        throw error;
      }
    })(),
    prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
    prisma.user.count(),
    prisma.user.findMany({
      where: { listings: { some: { status: ListingStatus.ACTIVE } } },
      select: {
        id: true,
        name: true,
        email: true,
        listings: {
          where: { status: ListingStatus.ACTIVE },
          select: { id: true, priceCents: true, activeUntil: true },
        },
      },
      take: 20,
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: trendStartDate } },
      select: { createdAt: true },
    }),
    prisma.listing.findMany({
      where: { createdAt: { gte: trendStartDate } },
      select: { createdAt: true },
    }),
    prisma.report.findMany({
      where: { createdAt: { gte: trendStartDate } },
      select: { createdAt: true, status: true },
    }),
  ]);

  const openReportsBySellerId = new Map<string, number>();
  openReports.forEach((report) => {
    const sellerId = report.listing?.sellerId;
    if (!sellerId) return;
    openReportsBySellerId.set(sellerId, (openReportsBySellerId.get(sellerId) || 0) + 1);
  });

  const topSellers = activeSellerRows
    .map((seller) => {
      const activeListings = seller.listings.length;
      const hasSubscription = seller.listings.some((listing) => !listing.activeUntil);
      const openReportsForSeller = openReportsBySellerId.get(seller.id) || 0;
      const estimatedMonthlyRevenue = hasSubscription
        ? 30
        : seller.listings.filter((listing) => listing.activeUntil).length * 4;

      return {
        id: seller.id,
        name: seller.name || seller.email.split("@")[0],
        activeListings,
        openReports: openReportsForSeller,
        plan: hasSubscription ? "Subscription" : "Pay per listing",
        estimatedMonthlyRevenue,
      };
    })
    .sort((a, b) => b.activeListings - a.activeListings)
    .slice(0, 10);

  const trendBuckets = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(trendStartDate);
    date.setUTCMonth(trendStartDate.getUTCMonth() + index);
    return {
      key: monthKey(date),
      label: monthLabel(date),
      users: 0,
      listings: 0,
      reports: 0,
    };
  });
  const trendMap = new Map(trendBuckets.map((bucket) => [bucket.key, bucket]));

  recentUsers.forEach((user) => {
    const bucket = trendMap.get(monthKey(user.createdAt));
    if (bucket) bucket.users += 1;
  });
  recentListings.forEach((listing) => {
    const bucket = trendMap.get(monthKey(listing.createdAt));
    if (bucket) bucket.listings += 1;
  });
  recentReports.forEach((report) => {
    const bucket = trendMap.get(monthKey(report.createdAt));
    if (bucket) bucket.reports += 1;
  });

  const maxTrendValue = Math.max(
    ...trendBuckets.map((bucket) => Math.max(bucket.users, bucket.listings, bucket.reports)),
    1,
  );
  const now = new Date();

  const openReportsOlderThan72h = openReports.filter(
    (report) => now.getTime() - report.createdAt.getTime() > 72 * 60 * 60 * 1000,
  ).length;

  return (
    <div className="space-y-6">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">Admin Control Center</h1>
            <p className="mt-2 text-muted-foreground">
              Professional dashboard for moderation, growth, sellers, and marketplace health.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/categories">
              <Button variant="outline">Category templates</Button>
            </Link>
            <Link href="/admin/subscriptions">
              <Button>Revenue analytics</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open reports</p>
              <p className="text-3xl font-black text-destructive">
                {openReports.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {openReportsOlderThan72h} older than 72h
              </p>
            </div>
            <AlertTriangle className="text-destructive" size={22} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending categories</p>
              <p className="text-3xl font-black text-warning">
                {pendingRequests.length}
              </p>
            </div>
            <ClipboardCheck className="text-warning" size={22} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active listings</p>
              <p className="text-3xl font-black text-primary">{activeListingsCount}</p>
            </div>
            <DollarSign className="text-primary" size={22} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Users / active sellers</p>
              <p className="text-3xl font-black text-secondary">
                {totalUsers}/{topSellers.length}
              </p>
            </div>
            <Users className="text-secondary" size={22} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Marketplace health trend (6 months)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid h-56 grid-cols-6 items-end gap-2 rounded-2xl border border-border/70 bg-muted/20 p-3">
              {trendBuckets.map((bucket) => {
                const usersHeight = (bucket.users / maxTrendValue) * 100;
                const listingsHeight = (bucket.listings / maxTrendValue) * 100;
                const reportsHeight = (bucket.reports / maxTrendValue) * 100;

                return (
                  <div
                    key={bucket.key}
                    className="flex h-full flex-col items-center justify-end gap-2"
                  >
                    <div className="flex h-full items-end gap-1">
                      <div
                        className="w-2 rounded-t bg-secondary"
                        style={{ height: `${Math.max(usersHeight, bucket.users ? 8 : 2)}%` }}
                        title={`${bucket.label} users: ${bucket.users}`}
                      />
                      <div
                        className="w-2 rounded-t bg-primary"
                        style={{
                          height: `${Math.max(listingsHeight, bucket.listings ? 8 : 2)}%`,
                        }}
                        title={`${bucket.label} listings: ${bucket.listings}`}
                      />
                      <div
                        className="w-2 rounded-t bg-warning"
                        style={{
                          height: `${Math.max(reportsHeight, bucket.reports ? 8 : 2)}%`,
                        }}
                        title={`${bucket.label} reports: ${bucket.reports}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{bucket.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded bg-secondary" />
                New users
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded bg-primary" />
                New listings
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded bg-warning" />
                Reports
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top sellers (connected analytics)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topSellers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active sellers yet.
              </p>
            ) : (
              topSellers.map((seller) => (
                <div
                  key={seller.id}
                  className="rounded-xl border border-border/70 bg-card px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{seller.name}</p>
                    <Badge
                      variant={
                        seller.openReports > 0 ? "warning" : "success"
                      }
                    >
                      {seller.openReports} open reports
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {seller.activeListings} active | {seller.plan} | est. $
                    {seller.estimatedMonthlyRevenue}/month
                  </p>
                </div>
              ))
            )}
            <Link href="/admin/subscriptions" className="block pt-1">
              <Button variant="outline" className="w-full justify-between">
                Open revenue dashboard <ArrowRight size={14} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Reports queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {openReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open reports right now.
            </p>
          ) : (
            <div className="space-y-3">
              {openReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border border-border/70 bg-muted/20 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {report.targetType} | {report.targetId}
                    </p>
                    <Badge variant="warning">OPEN</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.reason}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.targetType === "LISTING" && (
                      <form action="/api/admin/remove-listing" method="post">
                        <input type="hidden" name="listingId" value={report.targetId} />
                        <input type="hidden" name="reportId" value={report.id} />
                        <Button variant="outline" type="submit">
                          Remove listing
                        </Button>
                      </form>
                    )}
                    <form action="/api/admin/ban-user" method="post">
                      <input type="hidden" name="userId" value={report.targetId} />
                      <input type="hidden" name="reportId" value={report.id} />
                      <Button variant="destructive" type="submit">
                        Ban user
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Category requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending category requests.
              </p>
            ) : (
              pendingRequests.map((request) => (
                <form
                  key={request.id}
                  action={reviewCategoryRequest}
                  className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3"
                >
                  <input type="hidden" name="requestId" value={request.id} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{request.desiredName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {request.description && (
                    <p className="text-sm text-muted-foreground">
                      {request.description}
                    </p>
                  )}
                  <textarea
                    name="adminNotes"
                    className="min-h-20 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
                    placeholder="Optional admin notes"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button name="decision" value="approve" type="submit">
                      <CheckCircle2 size={15} className="mr-1" />
                      Approve
                    </Button>
                    <Button
                      name="decision"
                      value="reject"
                      variant="outline"
                      type="submit"
                    >
                      <Shield size={15} className="mr-1" />
                      Reject
                    </Button>
                  </div>
                </form>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin audit log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions logged yet.</p>
            ) : (
              actions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {action.actionType} | {action.targetType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {action.targetId} | {new Date(action.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp size={15} className="text-success" />
            Connected to real users, listings, reports, and seller performance.
          </p>
          <Link href="/admin/subscriptions">
            <Button variant="outline" className="gap-2">
              Revenue and plans
              <ArrowRight size={14} />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
