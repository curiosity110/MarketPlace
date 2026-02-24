import { notFound } from "next/navigation";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function ListingDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, status: ListingStatus.ACTIVE, activeUntil: { gt: new Date() } },
    include: { city: true, category: true, images: true, seller: true },
  });
  if (!listing) notFound();

  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold">{listing.title}</h1>
      <p>{listing.description}</p>
      <p>{listing.city.name} • {listing.category.name}</p>
      <p>{(listing.priceCents / 100).toFixed(2)} {listing.currency}</p>
      <p>Contact: {listing.seller.email}</p>
      <div className="grid gap-2">{listing.images.map((img) => <img key={img.id} src={img.url} alt={listing.title} className="max-w-md rounded border" />)}</div>
      <form action="/api/reports" method="post" className="grid gap-2 max-w-md">
        <input type="hidden" name="targetType" value="LISTING" />
        <input type="hidden" name="targetId" value={listing.id} />
        <input type="hidden" name="listingId" value={listing.id} />
        <textarea className="rounded border p-2" name="reason" required placeholder="Report reason" />
        <button type="submit" className="rounded border px-3 py-2">Report listing</button>
      </form>
    </div>
  );
}
