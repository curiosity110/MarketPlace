import { ListingCardSkeleton } from "@/components/listing-card/shared";
import { PageShell } from "@/components/ui/layout";

export default function LoadingBrowse() {
  return (
    <PageShell size="wide" className="space-y-5">
      <div className="space-y-2">
        <div className="h-11 w-full max-w-xl animate-pulse rounded-2xl bg-muted/70" />
        <div className="h-5 w-40 animate-pulse rounded bg-muted/60" />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </PageShell>
  );
}
