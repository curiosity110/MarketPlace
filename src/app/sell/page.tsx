import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { CreateListingGlobalServer } from "@/components/create-listing-global-server";

export default async function SellPage({
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

  const sessionUser = await getSessionUser();
  const sellPath = params.toString() ? `/sell?${params.toString()}` : "/sell";
  if (!sessionUser) {
    redirect(`/login?next=${encodeURIComponent(sellPath)}`);
  }

  if (params.get("create") !== "1") {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.delete("closed");
    nextParams.set("create", "1");
    redirect(`/sell?${nextParams.toString()}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <CreateListingGlobalServer
        forceOpen
        renderInline
        ignoreCircuitBreaker
        sessionUser={sessionUser}
      />
    </div>
  );
}
