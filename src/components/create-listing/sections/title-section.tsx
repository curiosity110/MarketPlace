"use client";

import { Input } from "@/components/ui/input";

type Props = {
  titleLabel: string;
  placeholder: string;
  helperLabel: string;
  value: string;
  error: string | null;
  isActiveStep: boolean;
  onChange: (value: string) => void;
};

export function CreateListingTitleSection({
  titleLabel,
  placeholder,
  helperLabel,
  value,
  error,
  isActiveStep,
  onChange,
}: Props) {
  return (
    <section
      className={`space-y-2 rounded-2xl bg-card/80 p-4 ring-1 ring-border/60 sm:p-5 ${
        isActiveStep ? "ring-primary/30" : ""
      }`}
    >
      <span className="text-sm font-semibold">{titleLabel}</span>
      <Input
        name="title"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
      />
      <p className="text-xs text-muted-foreground">{helperLabel}</p>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </section>
  );
}
