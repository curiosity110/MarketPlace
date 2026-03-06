"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function BrowseSearchBar({ label, placeholder, value, onChange }: Props) {
  return (
    <label className="min-w-0 max-w-full space-y-1">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <div className="relative min-w-0 max-w-full">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={15}
        />
        <Input
          name="q"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 max-w-full h-11 rounded-2xl bg-card pl-9 text-base"
          autoComplete="off"
        />
      </div>
    </label>
  );
}
