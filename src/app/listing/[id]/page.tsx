import { notFound } from "next/navigation";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ListingDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, status: ListingStatus.ACTIVE },
    include: {
      city: true,
      category: { include: { fieldTemplates: { where: { isActive: true }, orderBy: { order: "asc" } } } },
      images: true,
      seller: true,
      fieldValues: true,
    },
  });
  if (!listing) notFound();

  const valuesByKey = Object.fromEntries(listing.fieldValues.map((field) => [field.key, field.value]));

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{listing.title}</h1>
      <Card>
        <CardContent className="space-y-3">
          <p>{listing.description}</p>
          <p className="text-sm text-muted-foreground">{listing.city.name} • {listing.category.name}</p>
          <p className="text-xl font-semibold">{(listing.priceCents / 100).toFixed(2)} {listing.currency}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {listing.images.map((img) => <img key={img.id} src={img.url} alt={listing.title} className="w-full rounded border border-border" />)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="grid gap-2 sm:grid-cols-2">
            {listing.category.fieldTemplates.map((template) => {
              const value = valuesByKey[template.key];
              if (!value) return null;
              return (
                <div key={template.id} className="rounded-md border border-border bg-card/70 p-2">
                  <dt className="text-xs text-muted-foreground">{template.label}</dt>
                  <dd className="text-sm font-medium">{value}</dd>
                </div>
              );
            })}
          </dl>
          <Button type="button" variant="outline">Seller contact (coming soon)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
