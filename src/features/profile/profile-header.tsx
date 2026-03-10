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
      <div className="hero-surface space-y-4 rounded-[1.45rem] border border-border/40 p-4 sm:rounded-[1.9rem] sm:p-6">
        <div className="flex min-w-0 flex-col items-start gap-3.5 sm:flex-row sm:items-center">
          <div className="flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-full bg-card/75 text-base font-bold ring-1 ring-border/40 sm:h-18 sm:w-18 sm:text-xl">
            {avatarInitials}
          </div>
          <div className="min-w-0">
            <h1 className="break-words text-[1.55rem] font-semibold tracking-[-0.05em] [overflow-wrap:anywhere] sm:text-[2.2rem]">
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
