import Link from "next/link";
import { ArrowRight, Globe, ShieldCheck, Sparkles } from "lucide-react";
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
  return (
    <section className="hero-surface max-w-full overflow-hidden rounded-[1.6rem] border border-border/70 px-5 py-8 sm:px-7 sm:py-10 md:px-10 md:py-12">
      <div className="grid max-w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
        <div className="min-w-0 space-y-5">
          <Badge className="rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
            {text.heroBadge}
          </Badge>
          <h1 className="max-w-3xl break-words text-4xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-5xl lg:text-[3.6rem]">
            {text.heroTitleA}
            <span className="block bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
              {text.heroTitleB}
            </span>
          </h1>
          <p className="max-w-2xl break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere] sm:text-base">
            {text.heroDesc}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/browse">
              <Button size="lg" className="gap-2">
                {text.explore} <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href={createHref}>
              <Button size="lg" variant="outline" className="gap-2">
                {text.startSelling} <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="hidden gap-3 lg:grid lg:grid-cols-3">
            <div className="rounded-[1.15rem] border border-border/70 bg-card p-3">
              <Sparkles className="mb-2 text-primary" size={18} />
              <p className="text-sm font-semibold">{text.smartAssistance}</p>
            </div>
            <div className="rounded-[1.15rem] border border-border/70 bg-card p-3">
              <ShieldCheck className="mb-2 text-secondary" size={18} />
              <p className="text-sm font-semibold">{text.saferTrading}</p>
            </div>
            <div className="rounded-[1.15rem] border border-border/70 bg-card p-3">
              <Globe className="mb-2 text-primary" size={18} />
              <p className="text-sm font-semibold">{text.localGlobal}</p>
            </div>
          </div>
        </div>

        <Card className="min-w-0 max-w-full border-primary/20 bg-card/80">
          <CardHeader className="space-y-2">
            <CardTitle className={uiTypography.sectionTitle}>{text.whatBuyNow}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categoryHighlights.map((category) => (
              <Link
                key={category.id}
                href={`/browse?cat=${category.id}`}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-background/75 px-3 py-2 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-orange-50/50 hover:shadow-md dark:hover:bg-orange-500/10"
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
