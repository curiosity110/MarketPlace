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
  void isActiveStep;
  void helperLabel;
  return (
    <section className="space-y-2">
      <span className="text-sm font-semibold tracking-tight">{titleLabel}</span>
      <Input
        name="title"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
      />
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </section>
  );
}
