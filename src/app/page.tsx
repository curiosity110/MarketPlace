import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { isPrismaConnectionError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  markPrismaHealthy,
  markPrismaUnavailable,
  shouldSkipPrismaCalls,
} from "@/lib/prisma-circuit-breaker";
import { ListingCard } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pricingPlans = [
  {
    name: "Pay Per Listing",
    price: "$4",
    cadence: "for 30 days",
    description: "Great for occasional sellers",
    bullets: [
      "One active listing for 30 days",
      "GPT writing assistant",
      "Photos and dynamic category fields",
      "Basic seller insights",
    ],
    cta: "Start with $4",
    href: "/sell",
    featured: false,
  },
  {
    name: "Seller Subscription",
    price: "$30",
    cadence: "per month",
    description: "Best for active stores and resellers",
    bullets: [
      "Unlimited active listings",
      "Priority marketplace support",
      "Advanced analytics dashboard",
      "Higher visibility options",
    ],
    cta: "Subscribe for $30",
    href: "/sell",
    featured: true,
  },
];

export default async function Home() {
  async function fetchHomeData() {
    return Promise.all([
      prisma.listing.findMany({
        where: { status: ListingStatus.ACTIVE },
        include: {
          city: true,
          category: {
            include: {
              parent: true,
              fieldTemplates: {
                where: { isActive: true },
                orderBy: { order: "asc" },
              },
            },
          },
          images: true,
          fieldValues: true,
        },
        orderBy: { createdAt: "desc" },
        take: 9,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { listings: true } },
        },
        orderBy: { listings: { _count: "desc" } },
        take: 6,
      }),
    ]);
  }

  let latestListings: Awaited<ReturnType<typeof fetchHomeData>>[0] = [];
  let categoryHighlights: Awaited<ReturnType<typeof fetchHomeData>>[1] = [];
  let dbUnavailable = false;

  try {
    if (!shouldSkipPrismaCalls()) {
      [latestListings, categoryHighlights] = await fetchHomeData();
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

  return (
    <div className="space-y-12 md:space-y-16">
      <section className="hero-surface overflow-hidden rounded-3xl border border-border/70 px-5 py-10 sm:px-8 sm:py-12 md:px-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
              Built for Macedonia. Ready for worldwide reach.
            </Badge>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Buy and Sell Fast
              <span className="block bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
                in a Clear Marketplace
              </span>
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              Comfortable on phone and desktop, focused on readability, and
              powered by GPT help across the full site.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/browse">
                <Button size="lg" className="gap-2">
                  Explore Listings <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/sell">
                <Button size="lg" variant="outline">
                  Start Selling
                </Button>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card p-3">
                <Sparkles className="mb-2 text-primary" size={18} />
                <p className="text-sm font-semibold">GPT Assistance</p>
                <p className="text-xs text-muted-foreground">
                  Write stronger listings and get instant advice.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-3">
                <ShieldCheck className="mb-2 text-secondary" size={18} />
                <p className="text-sm font-semibold">Safer Trading</p>
                <p className="text-xs text-muted-foreground">
                  Moderation tools and reporting flow for trust.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-3">
                <Globe className="mb-2 text-primary" size={18} />
                <p className="text-sm font-semibold">Local + Global</p>
                <p className="text-xs text-muted-foreground">
                  Sell in Macedonia and publish globally.
                </p>
              </div>
            </div>
          </div>

          <Card className="border-primary/20 bg-card/80">
            <CardHeader className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Popular categories
              </p>
              <CardTitle className="text-2xl">What people buy now</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryHighlights.map((category) => (
                <Link
                  key={category.id}
                  href={`/browse?cat=${category.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-background/75 px-3 py-2 text-sm transition-colors hover:border-primary/35 hover:bg-orange-50/50 dark:hover:bg-orange-500/10"
                >
                  <span className="font-medium">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {category._count.listings} listings
                  </span>
                </Link>
              ))}
              <Link href="/categories" className="inline-block pt-2">
                <Button variant="ghost" className="gap-1 px-0">
                  View all categories <ArrowRight size={14} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {dbUnavailable && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4 text-sm text-foreground">
            Marketplace database is temporarily unreachable. Showing limited content.
          </CardContent>
        </Card>
      )}

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Seller Pricing</h2>
            <p className="text-muted-foreground">
              Simple model: $4 one listing for 30 days, or $30 monthly
              subscription.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.featured
                  ? "border-primary/35 bg-gradient-to-br from-orange-50/70 via-card to-blue-50/70 dark:from-orange-950/20 dark:to-blue-950/20"
                  : ""
              }
            >
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  {plan.featured && (
                    <Badge variant="primary" className="rounded-full px-3 py-1">
                      Recommended
                    </Badge>
                  )}
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                <p className="text-4xl font-black">
                  {plan.price}
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    {plan.cadence}
                  </span>
                </p>
                <ul className="space-y-2">
                  {plan.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button
                    className="w-full"
                    variant={plan.featured ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Latest Listings</h2>
          <p className="text-muted-foreground">
            Fresh items from sellers in Macedonia and beyond.
          </p>
        </div>

        {latestListings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No active listings yet. Create the first one.
              </p>
              <Link href="/sell" className="mt-4 inline-block">
                <Button>List an Item</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="responsive-grid gap-4">
              {latestListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            <div className="text-center">
              <Link href="/browse">
                <Button variant="outline">Browse all listings</Button>
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
