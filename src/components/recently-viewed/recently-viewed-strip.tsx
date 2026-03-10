"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatCurrencyFromCents } from "@/lib/currency";
import type { ListingCardDTO } from "@/lib/listing-card-select";
import { cn } from "@/lib/utils";
import { getRecentlyViewedIds } from "@/lib/recently-viewed";

type Props = {
  locale: "en" | "mk";
  title?: string;
  className?: string;
};

export function RecentlyViewedStrip({ locale, title, className }: Props) {
  const [listings, setListings] = React.useState<ListingCardDTO[]>([]);
  const [ids, setIds] = React.useState<string[]>([]);

  const loadIds = React.useCallback(() => {
    const next = getRecentlyViewedIds();
    setIds(next);
  }, []);

  React.useEffect(() => {
    loadIds();
    const onStorage = () => loadIds();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadIds]);

  React.useEffect(() => {
    if (ids.length < 2) {
      setListings([]);
      return;
    }
    const q = ids.slice(0, 5).join(",");
    fetch(`/api/listings/recent?ids=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => setListings(data.listings ?? []))
      .catch(() => setListings([]));
  }, [ids.join(",")]);

  if (listings.length < 2) return null;

  const label = title ?? (locale === "mk" ? "Неодамна прегледани" : "Recently Viewed");

  return (
    <section className={cn("space-y-2", className)}>
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listing/${listing.id}`}
            className="flex min-w-[140px] max-w-[160px] shrink-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
              {listing.images[0]?.url ? (
                <Image
                  src={listing.images[0].url}
                  alt={listing.title}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageOff size={20} />
                </div>
              )}
            </div>
            <div className="truncate px-2 py-1.5">
              <p className="truncate text-xs font-medium text-foreground">{listing.title}</p>
              <p className="text-sm font-bold text-orange-500">
                {formatCurrencyFromCents(listing.priceCents, listing.currency)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
