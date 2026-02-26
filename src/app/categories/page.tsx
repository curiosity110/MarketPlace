import Link from "next/link";
import { ArrowRight, Car, PlusCircle, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const iconBySlug: Record<string, string> = {
  cars: "🚗",
  "real-estate": "🏠",
  electronics: "💻",
  jobs: "💼",
  services: "🛠️",
  furniture: "🛋️",
  phones: "📱",
  fashion: "👕",
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const query = (sp.q || "").trim().toLowerCase();

  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      _count: {
        select: { listings: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const visibleCategories = categories.filter((category) =>
    query ? category.name.toLowerCase().includes(query) : true,
  );

  return (
    <div className="space-y-8">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h1 className="text-4xl font-black sm:text-5xl">Categories</h1>
            <p className="max-w-2xl text-muted-foreground">
              Explore categories for Macedonia and worldwide trading. Cars,
              electronics, real estate, and more with category-specific fields.
            </p>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCategories.map((category) => {
          const emoji = iconBySlug[category.slug] || "📦";
          const isCars = category.slug === "cars";

          return (
            <Card
              key={category.id}
              className="overflow-hidden border-border/75 transition-colors hover:border-primary/30"
            >
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-3xl">{emoji}</p>
                    <h2 className="mt-2 text-xl font-bold">{category.name}</h2>
                  </div>
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {category._count.listings} listings
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

                {isCars && (
                  <div className="rounded-xl border border-primary/25 bg-orange-50/60 p-3 text-sm dark:bg-orange-500/10">
                    <p className="mb-2 inline-flex items-center gap-1 font-semibold text-primary">
                      <Car size={15} />
                      Cars have advanced filters
                    </p>
                    <p className="text-muted-foreground">
                      Use year, fuel, transmission, and brand filters directly
                      in browse.
                    </p>
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href={`/browse?cat=${category.id}`}>
                    <Button variant="outline" className="w-full">
                      Browse
                    </Button>
                  </Link>
                  <Link href={`/sell?categoryId=${category.id}`}>
                    <Button className="w-full">Sell here</Button>
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
          Request a new category with the plus button inside the sell form.
          Admin can review and approve quickly.
        </p>
        <Link href="/sell" className="mt-4 inline-block">
          <Button variant="outline" className="gap-2">
            <PlusCircle size={16} />
            Open Sell Form
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
