import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buildCreateListingHref } from "@/lib/create-listing-href";

type Props = {
  locale?: "en" | "mk";
};

export function SiteFooter({ locale = "en" }: Props) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        title: "MarketPlace MKD",
        subtitle:
          "Паметен маркетплејс за локална и глобална продажба со чисти процеси за купување и објава.",
        browse: "Пребарувај",
        categories: "Категории",
        sell: "Продај",
        dashboard: "Контролна табла",
        rights: "Сите права се задржани.",
      }
    : {
        title: "MarketPlace MKD",
        subtitle:
          "A smart marketplace for local and global selling with clean flows for buying and publishing.",
        browse: "Browse",
        categories: "Categories",
        sell: "Sell",
        dashboard: "Dashboard",
        rights: "All rights reserved.",
      };

  return (
    <footer className="mt-8 border-t border-border/70 bg-card/60">
      <Container className="space-y-5 py-6 md:py-8">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div>
            <p className="text-base font-black">{text.title}</p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {text.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              href="/browse"
              className="rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/45 hover:text-primary"
            >
              {text.browse}
            </Link>
            <Link
              href="/categories"
              className="rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/45 hover:text-primary"
            >
              {text.categories}
            </Link>
            <Link
              href={buildCreateListingHref()}
              className="rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/45 hover:text-primary"
            >
              {text.sell}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/45 hover:text-primary"
            >
              {text.dashboard}
            </Link>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} MarketPlace MKD. {text.rights}
        </p>
      </Container>
    </footer>
  );
}

