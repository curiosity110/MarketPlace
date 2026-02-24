import { notFound } from "next/navigation";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ListingDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, status: ListingStatus.ACTIVE, activeUntil: { gt: new Date() } },
    include: { city: true, category: true, images: true, seller: true },
  });
  if (!listing) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{listing.title}</h1>
      <Card>
        <CardContent className="space-y-2">
          <p>{listing.description}</p>
          <p className="text-sm text-muted-foreground">{listing.city.name} • {listing.category.name}</p>
          <p className="font-medium">{(listing.priceCents / 100).toFixed(2)} {listing.currency}</p>
          <p className="text-sm">Contact: {listing.seller.email}</p>
          <div className="grid gap-2">
            {listing.images.map((img) => <img key={img.id} src={img.url} alt={listing.title} className="max-w-md rounded border border-border" />)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <form action="/api/reports" method="post" className="grid max-w-md gap-2">
            <input type="hidden" name="targetType" value="LISTING" />
            <input type="hidden" name="targetId" value={listing.id} />
            <input type="hidden" name="listingId" value={listing.id} />
            <textarea className="rounded-md border border-border bg-background p-2" name="reason" required placeholder="Report reason" />
            <Button variant="outline" type="submit">Report listing</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
