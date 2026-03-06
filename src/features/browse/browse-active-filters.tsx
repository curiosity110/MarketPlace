import Link from "next/link";
import type { ActiveFilterChip } from "@/features/browse/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  chips: ActiveFilterChip[];
  clearHref: string;
  clearLabel: string;
  removeLabel: string;
};

export function BrowseActiveFilters({
  chips,
  clearHref,
  clearLabel,
  removeLabel,
}: Props) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link key={chip.key} href={chip.href} scroll={false}>
          <Badge
            variant="secondary"
            className="h-auto max-w-full cursor-pointer gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
            aria-label={`${removeLabel}: ${chip.label}`}
          >
            <span className="truncate">{chip.label}</span>
            <span aria-hidden="true">×</span>
          </Badge>
        </Link>
      ))}
      <Link href={clearHref} scroll={false}>
        <Button variant="ghost" size="sm" className="h-8 rounded-full px-3">
          {clearLabel}
        </Button>
      </Link>
    </div>
  );
}
