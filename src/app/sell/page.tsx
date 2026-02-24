import Link from "next/link";
import { ListingCondition } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

async function createDraft(formData: FormData) {
  "use server";
  const user = await requireUser();
  const title = String(formData.get("title") || "Untitled");
  const categoryId = String(formData.get("categoryId"));
  const cityId = String(formData.get("cityId"));
  await prisma.listing.create({
    data: {
      sellerId: user.id,
      title,
      description: "",
      priceCents: 0,
      categoryId,
      cityId,
      condition: ListingCondition.USED,
    },
  });
  revalidatePath("/sell");
}

export default async function SellPage() {
  const user = await requireUser();
  const [categories, cities, listings] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.listing.findMany({ where: { sellerId: user.id }, orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My listings</h1>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="text-lg font-medium">Create listing</h2>
          <form action={createDraft} className="grid max-w-lg gap-2">
            <Input name="title" placeholder="Listing title" required />
            <Select name="categoryId">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Select name="cityId">{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Button type="submit">Create listing</Button>
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-2">
        {listings.map((listing) => (
          <li key={listing.id}>
            <Card>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <span>{listing.title}</span>
                  <Badge>{listing.status}</Badge>
                </div>
                <Link href={`/sell/${listing.id}/edit`}>
                  <Button variant="outline" type="button">Edit</Button>
                </Link>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
