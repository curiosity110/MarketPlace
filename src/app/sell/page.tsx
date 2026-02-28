import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/auth";

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireSeller();
  const sp = await searchParams;

  const params = new URLSearchParams();
  Object.entries(sp).forEach(([key, value]) => {
    if (!value) return;
    params.set(key, value);
  });
  params.set("create", "1");

  // /sell opens dashboard create popup flow and preserves status params.
  redirect(`/dashboard?${params.toString()}`);
}
