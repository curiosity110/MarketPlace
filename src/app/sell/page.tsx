import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { CreateListingGlobalServer } from "@/components/create-listing-global-server";
import { getServerLocale } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildCreateListingHref } from "@/lib/create-listing-href";

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const locale = await getServerLocale();
  const isMk = locale === "mk";
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

  const wasClosed = params.get("closed") === "1";
  const createRequested = params.get("create") === "1";
  const shouldForceOpen = createRequested;
  const reopenParams = new URLSearchParams(params.toString());
  reopenParams.delete("closed");
  const reopenHref = buildCreateListingHref(
    Object.fromEntries(reopenParams.entries()),
  );

  const text = isMk
    ? {
        title: "Креирај оглас",
        subtitle: "Отвори го попап формуларот и објави за неколку чекори.",
        open: "Отвори формулар",
        browse: "Продолжи со пребарување",
        reopen: "Отвори креирање",
      }
    : {
        title: "Create listing",
        subtitle: "Open the modal form and publish in a few guided steps.",
        open: "Open form",
        browse: "Continue browsing",
        reopen: "Open create listing",
      };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <Card className="border-border/70">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{text.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{text.subtitle}</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href={reopenHref}>
            <Button>{text.open}</Button>
          </Link>
          <Link href="/browse">
            <Button variant="outline">{text.browse}</Button>
          </Link>
        </CardContent>
      </Card>

      <CreateListingGlobalServer
        forceOpen={shouldForceOpen}
        ignoreCircuitBreaker
        sessionUser={sessionUser}
      />

      {wasClosed ? (
        <div className="flex justify-center">
          <Link href={reopenHref}>
            <Button>{text.reopen}</Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
