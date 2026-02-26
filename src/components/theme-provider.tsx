"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentPropsWithoutRef } from "react";

type ThemeProviderProps = ComponentPropsWithoutRef<typeof NextThemesProvider>;

export function ThemeProvider(props: ThemeProviderProps) {
  return <NextThemesProvider {...props} />;
}
