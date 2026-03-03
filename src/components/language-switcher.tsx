"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  label: string;
  englishLabel: string;
  macedonianLabel: string;
};

export function LanguageSwitcher({
  locale,
  label,
  englishLabel,
  macedonianLabel,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<Locale>(locale);

  async function onChange(nextLocale: Locale) {
    setValue(nextLocale);

    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
    } finally {
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
      <span className="hidden sm:inline">{label}</span>
      <select
        id="site-locale"
        name="locale"
        value={value}
        disabled={pending}
        onChange={(event) => onChange(event.target.value as Locale)}
        className="rounded-full border border-border/70 bg-background px-2 py-1 text-xs font-medium text-foreground"
        aria-label={label}
        autoComplete="off"
      >
        <option value="en">{englishLabel}</option>
        <option value="mk">{macedonianLabel}</option>
      </select>
    </label>
  );
}
