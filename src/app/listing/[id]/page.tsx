import { ListingDetailsFeaturePage } from "@/features/listing-details";

export default async function ListingDetails({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <ListingDetailsFeaturePage params={params} searchParams={searchParams} />;
}
