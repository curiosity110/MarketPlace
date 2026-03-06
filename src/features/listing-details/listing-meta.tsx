import { MapPin, ShieldCheck, Tag } from "lucide-react";
import type { ListingDetailsMetaProps } from "@/features/listing-details/types";

export function ListingMeta({
  cityName,
  categoryLabel,
  conditionLabel,
  text,
}: ListingDetailsMetaProps) {
  const items = [
    {
      key: "city",
      icon: MapPin,
      label: text.listedIn,
      value: cityName,
    },
    {
      key: "category",
      icon: Tag,
      label: text.category,
      value: categoryLabel,
    },
    {
      key: "condition",
      icon: ShieldCheck,
      label: text.condition,
      value: conditionLabel,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="min-w-0 rounded-[1rem] bg-muted/32 px-3 py-3 ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="mb-2 flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <Icon size={13} />
              {item.label}
            </div>
            <p className="break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
