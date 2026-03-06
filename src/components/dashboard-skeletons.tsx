import { ListingCardSkeleton } from "@/components/listing-card/shared";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card key={idx} className="border-border/70">
          <CardContent className="space-y-3 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardFilterSkeleton() {
  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div className="h-10 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 animate-pulse rounded-xl bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardListingsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <ListingCardSkeleton key={idx} />
      ))}
    </div>
  );
}
