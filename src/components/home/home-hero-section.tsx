"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeHeroSearch } from "@/components/home/home-hero-search";
import { localizeCategoryName } from "@/lib/category-label";
import type { HomeCategoryHighlight, HomeText } from "@/components/home/home.types";
import type { Locale } from "@/lib/i18n";

const OPEN_CREATE_MODAL_EVENT = "mkd:open-create-modal";

type Props = {
  locale: Locale;
  text: HomeText;
  createHref: string;
  categoryHighlights: HomeCategoryHighlight[];
};

export function HomeHeroSection({
  locale,
  text,
  createHref,
  categoryHighlights,
}: Props) {
  const router = useRouter();
  const openCreateModal = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent(OPEN_CREATE_MODAL_EVENT, { detail: { params: { create: "1" } } }),
    );
    // Fallback: URL update opens the modal even if the event was missed
    router.replace("/?create=1", { scroll: false });
  }, [router]);
  const heroCategories = categoryHighlights.slice(0, 5);
  const highlightCategories = categoryHighlights.slice(0, 5);

  return (
    <section className="hero-surface max-w-full overflow-hidden rounded-[1.7rem] border border-border/45 px-4 py-5 sm:rounded-[2rem] sm:px-8 sm:py-10 md:px-10 md:py-12">
      <div className="grid max-w-full min-w-0 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-8">
        <div className="min-w-0 space-y-4">
          <Badge className="rounded-full border border-secondary/18 bg-secondary/8 px-3 py-1 text-xs font-semibold text-secondary">
            {text.heroBadge}
          </Badge>
          <h1 className="max-w-3xl break-words text-[2.1rem] font-semibold tracking-[-0.05em] [overflow-wrap:anywhere] sm:text-[3.6rem] lg:text-[4.5rem]">
            {text.heroTitleA}
            <span className="block bg-gradient-to-r from-[rgb(228,120,62)] via-[rgb(208,118,82)] to-[rgb(102,128,168)] bg-clip-text text-transparent">
              {text.heroTitleB}
            </span>
          </h1>
          <p className="max-w-2xl break-words text-[0.94rem] leading-6 text-muted-foreground [overflow-wrap:anywhere]">
            {text.heroDesc}
          </p>

          <div className="flex flex-col gap-3">
            <HomeHeroSearch locale={locale} />
            {heroCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {heroCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/browse?cat=${category.id}`}
                    className="rounded-full bg-card/72 px-3.5 py-2 text-[13px] font-medium text-foreground/85 ring-1 ring-black/4 transition-colors hover:bg-card hover:text-foreground"
                  >
                    {localizeCategoryName(category, locale)}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 pt-0.5">
            <Link href="/browse">
              <Button size="lg" className="h-11 gap-2 px-5">
                {text.explore} <ArrowRight size={16} />
              </Button>
            </Link>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-11 gap-2 px-5"
              onClick={openCreateModal}
            >
              {text.startSelling} <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        <Card className="min-w-0 max-w-full rounded-[1.3rem] border-border/45 bg-card/80 shadow-[0_16px_36px_-36px_rgba(15,23,42,0.28)] max-lg:hidden">
          <CardHeader className="space-y-1.5 pb-2 pt-4">
            <CardTitle className="text-[0.95rem] font-semibold tracking-[-0.02em] text-foreground/92">
              {text.whatBuyNow}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {highlightCategories.map((category) => (
              <Link
                key={category.id}
                href={`/browse?cat=${category.id}`}
                className="flex items-center justify-between rounded-[1rem] bg-background/68 px-3.5 py-2.5 text-[13px] transition-all duration-200 hover:bg-background"
              >
                <span className="min-w-0 truncate font-medium">
                  {localizeCategoryName(category, locale)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {category._count.listings} {text.listings}
                </span>
              </Link>
            ))}
            <Link href="/categories" className="inline-block pt-1">
              <Button variant="ghost" className="h-9 gap-1 px-0 text-sm">
                {text.viewAllCategories} <ArrowRight size={14} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
