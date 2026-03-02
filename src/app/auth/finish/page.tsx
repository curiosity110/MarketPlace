import { redirect } from "next/navigation";

export default async function FinishAuth({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  Object.entries(sp).forEach(([key, value]) => {
    if (!value) return;
    params.set(key, value);
  });

  const query = params.toString();
  redirect(query ? `/auth/callback?${query}` : "/auth/callback");
}
