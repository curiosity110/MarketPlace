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
  return (
    <>
      <CompactBackButton label={backLabel} fallbackHref={backHref} />
      <section className="max-w-full min-w-0 overflow-x-hidden rounded-3xl border border-border/70 bg-card px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex max-w-full min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/30 text-lg font-bold">
            {avatarInitials}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <h1 className="truncate text-xl font-semibold sm:text-2xl">{displayName}</h1>
              <p className="text-sm text-muted-foreground">{sellerHandle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/70 bg-muted/20 px-2.5 py-1">
                {memberSinceLabel} {joinedDateLabel}
              </span>
              {profileLocation ? (
                <span className="rounded-full border border-border/70 bg-muted/20 px-2.5 py-1">
                  {locationLabel}: {profileLocation}
                </span>
              ) : null}
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">
                {activeLabel}: {activeCount}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
