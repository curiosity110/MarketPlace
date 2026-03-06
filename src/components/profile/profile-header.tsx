import { CompactBackButton } from "@/components/compact-back-button";

type ProfileHeaderProps = {
  backLabel: string;
  backHref: string;
  displayName: string;
  sellerHandle: string;
  memberSinceLabel: string;
  joinedDateLabel: string;
  locationLabel: string;
  profileLocation: string;
  activeLabel: string;
  activeCount: number;
  avatarInitials: string;
};

export function ProfileHeader({
  backLabel,
  backHref,
  displayName,
  sellerHandle,
  memberSinceLabel,
  joinedDateLabel,
  locationLabel,
  profileLocation,
  activeLabel,
  activeCount,
  avatarInitials,
}: ProfileHeaderProps) {
  void memberSinceLabel;
  void locationLabel;
  return (
    <section className="max-w-full min-w-0 space-y-3 overflow-x-hidden border-b border-border/40 pb-3 sm:pb-4">
      <CompactBackButton label={backLabel} fallbackHref={backHref} className="w-fit" />
      <div className="flex max-w-full min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted/40 text-lg font-bold ring-1 ring-black/5 dark:ring-white/10">
            {avatarInitials}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{displayName}</h1>
              <p className="text-sm text-muted-foreground">{sellerHandle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{joinedDateLabel}</span>
              {profileLocation ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  {profileLocation}
                </>
              ) : null}
              <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                {activeCount} {activeLabel}
              </span>
            </div>
          </div>
      </div>
    </section>
  );
}
