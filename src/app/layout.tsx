import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarketPlace MK",
  description: "Macedonia-only marketplace",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-white text-black dark:bg-zinc-950 dark:text-zinc-100`}>
        <ThemeProvider>
          <Nav />
          <main className="mx-auto max-w-6xl p-4">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
