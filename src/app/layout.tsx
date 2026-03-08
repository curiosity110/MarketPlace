import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Container } from "@/components/ui/container";
import { SiteAssistant } from "@/components/site-assistant";
import { CreateListingGlobalServer } from "@/components/create-listing-global-server";
import { SiteFooter } from "@/components/site-footer";
import { getServerLocale } from "@/lib/i18n";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarketPlace MKD",
  description:
    "Business marketplace for Macedonia and worldwide trading. Buy and sell securely.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
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
            <main className="min-h-[calc(100vh-4rem)] overflow-x-clip" data-no-horizontal-scroll>
              <Container className="pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pt-3 md:pb-10 md:pt-6">
                {children}
              </Container>
            </main>
            <SiteFooter locale={locale} />
            <SiteAssistant locale={locale} />
            <CreateListingGlobalServer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
