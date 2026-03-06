"use client";

import { Textarea } from "@/components/ui/textarea";

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function CreateListingDescriptionSection({
  label,
  placeholder,
  value,
  onChange,
}: Props) {
  return (
    <div className="space-y-2 rounded-2xl bg-card/80 p-4 ring-1 ring-border/60 sm:p-5">
      <label className="space-y-1.5">
        <span className="text-sm font-semibold tracking-tight">{label}</span>
        <Textarea
          name="description"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          placeholder={placeholder}
        />
      </label>
    </div>
  );
}
