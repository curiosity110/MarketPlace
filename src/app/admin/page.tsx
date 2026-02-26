import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Shield,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
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

async function reviewCategoryRequest(formData: FormData) {
  "use server";

  await requireAdmin();
  const requestId = String(formData.get("requestId") || "");
  const decision = String(formData.get("decision") || "");
  const adminNotes = String(formData.get("adminNotes") || "").trim();

  const request = await prisma.categoryRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== "PENDING") return;

  if (decision === "approve") {
    const baseSlug = slugify(request.desiredName);
    let nextSlug = baseSlug || `category-${Date.now()}`;
    let index = 1;

    while (await prisma.category.findUnique({ where: { slug: nextSlug } })) {
      nextSlug = `${baseSlug}-${index++}`;
    }

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
        data: { status: "APPROVED", adminNotes: adminNotes || "Approved by admin" },
      }),
    ]);
  } else if (decision === "reject") {
    await prisma.categoryRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", adminNotes: adminNotes || "Rejected by admin" },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/categories");
  revalidatePath("/sell");
}

export default async function AdminPage() {
  await requireAdmin();

  const [openReports, actions, pendingRequests, activeListings, totalUsers, activeSellers] =
    await Promise.all([
      prisma.report.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.adminAction.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.categoryRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
      }),
      prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
      prisma.user.count(),
      prisma.listing.findMany({
        where: { status: ListingStatus.ACTIVE },
        select: { sellerId: true },
        distinct: ["sellerId"],
      }),
    ]);

  return (
    <div className="space-y-6">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">Admin Control Center</h1>
            <p className="mt-2 text-muted-foreground">
              Moderation, growth analytics, and category governance.
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
              <p className="text-3xl font-black text-primary">{activeListings}</p>
            </div>
            <DollarSign className="text-primary" size={22} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Users / sellers</p>
              <p className="text-3xl font-black text-secondary">
                {totalUsers}/{activeSellers.length}
              </p>
            </div>
            <Users className="text-secondary" size={22} />
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
                      {report.targetType} · {report.targetId}
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

      <Card>
        <CardHeader>
          <CardTitle>Category requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending requests.
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
                  <Button name="decision" value="reject" variant="outline" type="submit">
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
                  {action.actionType} · {action.targetType}
                </p>
                <p className="text-xs text-muted-foreground">
                  {action.targetId} · {new Date(action.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
