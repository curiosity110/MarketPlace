import type { Metadata } from "next";
import { ListingDetailsFeaturePage } from "@/features/listing-details";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!listing) return { title: "Listing | MarketPlace MKD" };
  return {
    title: `${listing.title} | MarketPlace MKD`,
    description: listing.title,
  };
}

export default async function ListingDetails({ params, searchParams }: Props) {
  return <ListingDetailsFeaturePage params={params} searchParams={searchParams} />;
}
