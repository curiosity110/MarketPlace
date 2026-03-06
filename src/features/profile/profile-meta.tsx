import { StatItem } from "@/components/ui/layout";

type Props = {
  memberSinceLabel: string;
  joinedDateLabel: string;
  emailLabel: string;
  emailValue: string;
  locationLabel: string;
  locationValue: string;
  sellerStatusLabel: string;
  activeLabel: string;
  activeCount: number;
};

export function ProfileMeta({
  memberSinceLabel,
  joinedDateLabel,
  emailLabel,
  emailValue,
  locationLabel,
  locationValue,
  sellerStatusLabel,
  activeLabel,
  activeCount,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_240px]">
      <div className="grid gap-3 sm:grid-cols-2">
        <MetaItem label={memberSinceLabel} value={joinedDateLabel} />
        <MetaItem label={emailLabel} value={emailValue} />
        {locationValue ? <MetaItem label={locationLabel} value={locationValue} /> : null}
        <MetaItem label={sellerStatusLabel} value={activeCount > 0 ? activeLabel : "Idle"} />
      </div>
      <StatItem label={activeLabel} value={activeCount} className="py-3" />
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-border/50 bg-muted/18 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}
