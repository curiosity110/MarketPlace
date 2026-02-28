import { redirect } from "next/navigation";

export default async function FinishAuth({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const next =
    sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/browse";
  redirect(`/register?next=${encodeURIComponent(next)}`);
}
