"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function BrowseSearch({ label, placeholder, value, onChange }: Props) {
  return (
    <label className="block min-w-0">
      <span className="sr-only">{label}</span>
      <div className="relative min-w-0">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 rounded-2xl bg-card pl-10 text-base"
          autoComplete="off"
        />
      </div>
    </label>
  );
}
