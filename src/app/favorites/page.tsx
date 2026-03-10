import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listFavorites } from "@/lib/actions/favorites";
import { getServerLocale } from "@/lib/i18n";
import { PageShell } from "@/components/ui/layout";
import { BrowseCard } from "@/features/browse/browse-card";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Favorites | MarketPlace MKD",
  description: "Your saved listings on MarketPlace MKD.",
};

export default async function FavoritesPage() {
  const locale = await getServerLocale();
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/favorites")}`);
  }

  const rows = await listFavorites({ limit: 100 });
  const listings = rows.map((r) => r.listing).filter(Boolean);
  const favoriteIds = new Set(listings.map((l) => l.id));

  const isMk = locale === "mk";
  const title = isMk ? "Омилени" : "Favorites";
  const emptyLabel = isMk ? "Немате зачувани огласи." : "You have no saved listings.";
  const browseLabel = isMk ? "Пребарувај" : "Browse";

  return (
    <PageShell size="wide" className="space-y-5">
      <div className="flex items-center gap-2">
        <Heart size={24} className="shrink-0 fill-orange-500 text-orange-500" />
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/50 bg-muted/20 py-16 text-center">
          <Heart size={48} className="text-muted-foreground/50" />
          <p className="text-muted-foreground">{emptyLabel}</p>
          <a
            href="/browse"
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            {browseLabel}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <BrowseCard
              key={listing.id}
              listing={listing}
              locale={locale}
              currentAuthUserId={user.authUserId}
              isFavorited={favoriteIds.has(listing.id)}
              browseQuery=""
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
