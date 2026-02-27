import Link from "next/link";
import type { Listing } from "@prisma/client";
import { formatCurrencyFromCents } from "@/lib/currency";

type ListingWithRelations = Listing & {
  category?: {
    id: string;
    name: string;
    parent?: { id: string; name: string };
  } | null;
  city?: { id: string; name: string } | null;
};

export function ListingsGrid({
  listings,
  totalCount,
  page,
  pageSize,
}: {
  listings: ListingWithRelations[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-semibold">Browse</div>
          <div className="text-sm text-muted-foreground">{totalCount} results</div>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-border bg-background p-10 text-center text-sm text-muted-foreground">
          No listings match your filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listing/${listing.id}`}
              className="rounded-xl border border-border bg-background p-4 transition hover:shadow-sm"
            >
              <div className="line-clamp-1 text-sm font-semibold">{listing.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {listing.category?.parent
                  ? `${listing.category.parent.name} / ${listing.category.name}`
                  : listing.category?.name}{" "}
                | {listing.city?.name}
              </div>
              <div className="mt-3 text-base font-semibold">
                {formatCurrencyFromCents(listing.priceCents, listing.currency)}
              </div>
              <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {listing.description}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {page} / {totalPages}
        </div>
        <div className="flex gap-2">
          <Link
            className={`rounded-md border px-3 py-1 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
            href={`/browse?page=${Math.max(1, page - 1)}`}
          >
            Prev
          </Link>
          <Link
            className={`rounded-md border px-3 py-1 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
            href={`/browse?page=${Math.min(totalPages, page + 1)}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
