import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/listing-card";

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
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">MarketPlace MK</p>
          <h1 className="text-3xl font-semibold">Buy & sell locally in North Macedonia</h1>
          <p className="text-muted-foreground">
            Post your listing in minutes, reach verified local buyers, and keep the transaction off-platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/browse">
              <Button>Browse listings</Button>
            </Link>
            <Link href="/sell">
              <Button variant="outline">Sell something</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Latest listings</h2>
          <Link href="/browse" className="text-sm text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        {latestListings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No active listings yet. Be the first seller!</CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {latestListings.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
