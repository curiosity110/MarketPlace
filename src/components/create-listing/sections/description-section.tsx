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
    <div className="space-y-2">
      <label className="space-y-1.5">
        <span className="text-sm font-semibold tracking-tight">{label}</span>
        <Textarea
          name="description"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="min-h-[120px]"
          placeholder={placeholder}
        />
      </label>
    </div>
  );
}
