import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ListingCard } from "@/components/listing-card";
import { Container } from "@/components/ui/container";
import { AIHelper } from "@/components/ai-helper";
import { CheckCircle2, Zap, Shield } from "lucide-react";

export default async function Home() {
  const latestListings = await prisma.listing.findMany({
    where: { status: ListingStatus.ACTIVE },
    include: {
      city: true,
      category: {
        include: {
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
    take: 12,
  });

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-50 via-blue-50 to-white dark:from-orange-950/30 dark:via-blue-950/30 dark:to-background py-16 md:py-24 -mx-6 px-6 mb-12">
        <Container className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-400 dark:to-orange-300 bg-clip-text text-transparent">
                Buy & Sell
              </span>
              <span className="block text-foreground mt-2">
                Anything, Anywhere
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Macedonia's trusted marketplace. List items in seconds with AI
              assistance. Safe, fast, reliable.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/browse">
              <Button size="lg" className="w-full sm:w-auto">
                Start Browsing
              </Button>
            </Link>
            <Link href="/sell">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Start Selling
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            {[
              {
                icon: Zap,
                label: "List in Seconds",
                desc: "AI helps you write descriptions",
              },
              {
                icon: Shield,
                label: "Safe Trading",
                desc: "Verified users & secure transactions",
              },
              {
                icon: CheckCircle2,
                label: "Best Prices",
                desc: "Compare & find the best deals",
              },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex flex-col items-center gap-2"
              >
                <feature.icon className="text-primary" size={32} />
                <p className="font-semibold text-foreground">{feature.label}</p>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Pricing Section */}
      <Container className="mb-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that works for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Pay Per Listing */}
          <Card className="border-2 hover:border-primary transition-colors transform hover:scale-105 duration-200">
            <CardHeader>
              <CardTitle>Pay Per Listing</CardTitle>
              <CardDescription>Perfect for occasional sellers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <span className="text-4xl font-bold text-primary">$4</span>
                <p className="text-sm text-muted-foreground">
                  per listing • 30 days
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  "List 1 item for 30 days",
                  "AI writing assistant",
                  "Photo uploads",
                  "Basic analytics",
                ].map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2
                      size={16}
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-4">Get Started</Button>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="border-2 border-orange-400 dark:border-orange-500 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-950/20 dark:to-blue-950/20 transform hover:scale-105 duration-200">
            <div className="absolute -top-3 left-6">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </span>
            </div>
            <CardHeader>
              <CardTitle>Premium Seller</CardTitle>
              <CardDescription>For serious sellers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <span className="text-4xl font-bold text-primary">$30</span>
                <p className="text-sm text-muted-foreground">
                  per month (cancel anytime)
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  "Unlimited listings",
                  "Priority AI assistant",
                  "Advanced analytics",
                  "Higher search visibility",
                  "24/7 seller support",
                ].map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2
                      size={16}
                      className="text-primary flex-shrink-0 mt-0.5"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-4" variant="default">
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>

      {/* Latest Listings */}
      <Container className="mb-16">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Latest Listings
            </h2>
            <p className="text-muted-foreground">
              Check out what's hot right now
            </p>
          </div>

          {latestListings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No listings yet. Be the first to sell!
                </p>
                <Link href="/sell">
                  <Button>Create Your First Listing</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="responsive-grid gap-4">
              {latestListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="text-center pt-8">
            <Link href="/browse">
              <Button variant="outline" size="lg">
                View All Listings
              </Button>
            </Link>
          </div>
        </div>
      </Container>

      {/* AI Assistant */}
      <AIHelper
        context="You are a helpful marketplace assistant. Help users find products, write descriptions, or answer questions about buying and selling."
        placeholder="Need help? Ask me anything!"
        title="Marketplace Assistant"
      />
    </div>
  );
}
