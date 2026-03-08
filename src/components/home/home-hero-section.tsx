import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uiTypography } from "@/components/ui/ui-patterns";
import { localizeCategoryName } from "@/lib/category-label";
import type { HomeCategoryHighlight, HomeText } from "@/components/home/home.types";
import type { Locale } from "@/lib/i18n";

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
  const heroCategories = categoryHighlights.slice(0, 4);

  return (
    <section className="hero-surface max-w-full overflow-hidden rounded-[2rem] border border-border/45 px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12">
      <div className="grid max-w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
        <div className="min-w-0 space-y-6">
          <Badge className="rounded-full border border-secondary/18 bg-secondary/8 px-3 py-1 text-xs font-semibold text-secondary">
            {text.heroBadge}
          </Badge>
          <h1 className="max-w-3xl break-words text-[2.7rem] font-semibold tracking-[-0.05em] [overflow-wrap:anywhere] sm:text-[3.6rem] lg:text-[4.5rem]">
            {text.heroTitleA}
            <span className="block bg-gradient-to-r from-[rgb(228,120,62)] via-[rgb(208,118,82)] to-[rgb(102,128,168)] bg-clip-text text-transparent">
              {text.heroTitleB}
            </span>
          </h1>
          <p className="max-w-2xl break-words text-base leading-7 text-muted-foreground [overflow-wrap:anywhere]">
            {text.heroDesc}
          </p>

          {heroCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {heroCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/browse?cat=${category.id}`}
                  className="rounded-full bg-card/72 px-3.5 py-2 text-sm text-foreground/78 ring-1 ring-black/4 transition-colors hover:text-foreground"
                >
                  {localizeCategoryName(category, locale)}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link href="/browse">
              <Button size="lg" className="h-12 gap-2 px-6">
                {text.explore} <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href={createHref}>
              <Button size="lg" variant="outline" className="h-12 gap-2 px-6">
                {text.startSelling} <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>

        <Card className="min-w-0 max-w-full">
          <CardHeader className="space-y-2 pb-3">
            <CardTitle className={uiTypography.sectionTitle}>
              {text.whatBuyNow}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categoryHighlights.map((category) => (
              <Link
                key={category.id}
                href={`/browse?cat=${category.id}`}
                className="flex items-center justify-between rounded-[1.2rem] bg-background/70 px-4 py-3 text-sm transition-all duration-200 hover:bg-background"
              >
                <span className="min-w-0 truncate font-medium">
                  {localizeCategoryName(category, locale)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {category._count.listings} {text.listings}
                </span>
              </Link>
            ))}
            <Link href="/categories" className="inline-block pt-2">
              <Button variant="ghost" className="gap-1 px-0">
                {text.viewAllCategories} <ArrowRight size={14} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
