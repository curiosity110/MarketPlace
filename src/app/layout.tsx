import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Container } from "@/components/ui/container";
import { SiteAssistant } from "@/components/site-assistant";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarketPlace MKD",
  description:
    "Business marketplace for Macedonia and worldwide trading. Buy and sell securely.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background text-foreground">
            <Nav />
            <main>
              <Container className="pb-28 pt-6 md:pb-10 md:pt-8">
                {children}
              </Container>
            </main>
            <SiteAssistant />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
