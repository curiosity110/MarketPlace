"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

const PLACEHOLDERS_EN = [
  "Search for a car...",
  "Find electronics...",
  "Browse real estate...",
  "Discover fashion...",
  "Find jobs...",
];

const PLACEHOLDERS_MK = [
  "Пребарај автомобил...",
  "Најди електроника...",
  "Прегледај недвижнини...",
  "Откриј мода...",
  "Најди работа...",
];

type Props = {
  locale: "en" | "mk";
};

export function HomeHeroSearch({ locale }: Props) {
  const placeholders = locale === "mk" ? PLACEHOLDERS_MK : PLACEHOLDERS_EN;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(id);
  }, [placeholders.length]);

  return (
    <form action="/browse" method="GET" className="relative w-full max-w-xl">
      <Search
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        placeholder={placeholders[index]}
        className="w-full rounded-full border border-input bg-background pl-12 pr-5 py-3.5 text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 hover:border-orange-300"
        aria-label={locale === "mk" ? "Пребарај огласи" : "Search listings"}
      />
    </form>
  );
}
