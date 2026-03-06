import { BackLink } from "@/components/ui/layout";
import { ProfileMeta } from "@/features/profile/profile-meta";

type Props = {
  backLabel: string;
  backHref: string;
  displayName: string;
  sellerHandle: string;
  joinedDateLabel: string;
  memberSinceLabel: string;
  emailLabel: string;
  emailValue: string;
  locationLabel: string;
  locationValue: string;
  sellerStatusLabel: string;
  activeLabel: string;
  activeCount: number;
  avatarInitials: string;
};

export function ProfileHeader({
  backLabel,
  backHref,
  displayName,
  sellerHandle,
  joinedDateLabel,
  memberSinceLabel,
  emailLabel,
  emailValue,
  locationLabel,
  locationValue,
  sellerStatusLabel,
  activeLabel,
  activeCount,
  avatarInitials,
}: Props) {
  void sellerHandle;

  return (
    <section className="space-y-4">
      <BackLink label={backLabel} fallbackHref={backHref} className="w-fit" />
      <div className="space-y-4 rounded-[1.2rem] border border-border/50 bg-card/82 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted/40 text-lg font-bold ring-1 ring-border/50">
            {avatarInitials}
          </div>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
              {displayName}
            </h1>
          </div>
        </div>

        <ProfileMeta
          memberSinceLabel={memberSinceLabel}
          joinedDateLabel={joinedDateLabel}
          emailLabel={emailLabel}
          emailValue={emailValue}
          locationLabel={locationLabel}
          locationValue={locationValue}
          sellerStatusLabel={sellerStatusLabel}
          activeLabel={activeLabel}
          activeCount={activeCount}
        />
      </div>
    </section>
  );
}
