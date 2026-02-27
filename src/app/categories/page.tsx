import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Car,
  House,
  Laptop2,
  PackageOpen,
  PlusCircle,
  Search,
  Shirt,
  Smartphone,
  Sofa,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";

const iconBySlug = {
  cars: Car,
  "real-estate": House,
  electronics: Laptop2,
  jobs: BriefcaseBusiness,
  services: Wrench,
  furniture: Sofa,
  phones: Smartphone,
  fashion: Shirt,
} as const;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const query = (sp.q || "").trim().toLowerCase();

  async function fetchCategoriesData() {
    return prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
        listings: {
          select: { status: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  let categories: Awaited<ReturnType<typeof fetchCategoriesData>> = [];
  let dbUnavailable = false;
  try {
    if (!shouldSkipPrismaCalls()) {
      categories = await fetchCategoriesData();
      markPrismaHealthy();
    } else {
      dbUnavailable = true;
    }
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      markPrismaUnavailable();
      dbUnavailable = true;
    } else {
      throw error;
    }
  }

  const visibleCategories = categories.filter((category) =>
    query ? category.name.toLowerCase().includes(query) : true,
  );
  const totalActiveListings = categories.reduce(
    (sum, category) =>
      sum +
      category.listings.filter((listing) => listing.status === "ACTIVE").length,
    0,
  );
  const totalSubcategories = categories.reduce(
    (sum, category) => sum + category.children.length,
    0,
  );

  return (
    <div className="space-y-7">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h1 className="text-4xl font-black sm:text-5xl">Categories</h1>
            <p className="max-w-2xl text-muted-foreground">
              Clean category map for browsing and selling. Pick category, filter fast, and create
              listings directly.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Main categories
              </p>
              <p className="text-2xl font-black">{categories.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Subcategories</p>
              <p className="text-2xl font-black">{totalSubcategories}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Active listings
              </p>
              <p className="text-2xl font-black">{totalActiveListings}</p>
            </div>
          </div>

          <form method="get" className="max-w-xl">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Search categories"
                className="pl-9"
              />
            </div>
          </form>
        </div>
      </section>

      {dbUnavailable && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">
            Categories are temporarily unavailable because the database is unreachable.
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCategories.map((category) => {
          const Icon = iconBySlug[category.slug as keyof typeof iconBySlug] || PackageOpen;
          const activeCount = category.listings.filter(
            (listing) => listing.status === "ACTIVE",
          ).length;
          const totalCount = category.listings.length;

          return (
            <Card
              key={category.id}
              className="overflow-hidden border-border/75 transition-all hover:-translate-y-0.5 hover:border-primary/30"
            >
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="inline-flex rounded-xl border border-border/70 bg-muted/20 p-2">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <h2 className="mt-2 text-xl font-bold">{category.name}</h2>
                  </div>
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {activeCount}/{totalCount}
                  </span>
                </div>

                {category.children.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/browse?sub=${child.id}`}
                        className="rounded-full border border-secondary/20 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:border-secondary/35 dark:bg-blue-500/10 dark:text-blue-300"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href={`/browse?cat=${category.id}`}>
                    <Button variant="outline" className="w-full">
                      Browse
                    </Button>
                  </Link>
                  <Link href={`/sell/analytics?create=1&cat=${category.id}`}>
                    <Button className="w-full">Create here</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="rounded-3xl border border-dashed border-border bg-card p-6 text-center">
        <h2 className="text-2xl font-bold">Missing a category?</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Open your dashboard and request a new category. The team can approve it quickly.
        </p>
        <Link href="/sell/analytics" className="mt-4 inline-block">
          <Button variant="outline" className="gap-2">
            <PlusCircle size={16} />
            Open dashboard categories
          </Button>
        </Link>
        <Link
          href="/browse"
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Continue browsing <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
