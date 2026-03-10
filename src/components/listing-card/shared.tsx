import type React from "react";
import Image from "next/image";
import Link from "next/link";
import type { ListingCondition } from "@prisma/client";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Locale = "en" | "mk";

export function formatListingCardDate(value: string | Date, locale: Locale) {
  return new Date(value).toLocaleDateString(locale === "mk" ? "mk-MK" : "en-US");
}

/** Relative date for cards: Today, Yesterday, 3 days ago, Last week, 2 weeks ago, or "Feb 2026". */
export function formatListingCardDateRelative(value: string | Date, locale: Locale): string {
  const date = new Date(value);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = todayStart.getTime() - dateStart.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return locale === "mk" ? "Денес" : "Today";
  if (diffDays === 1) return locale === "mk" ? "Вчера" : "Yesterday";
  if (diffDays >= 2 && diffDays <= 6) return locale === "mk" ? `Пред ${diffDays} дена` : `${diffDays} days ago`;
  if (diffDays >= 7 && diffDays < 14) return locale === "mk" ? "Минатата недела" : "Last week";
  if (diffDays >= 14 && diffDays < 30) return locale === "mk" ? `Пред ${Math.floor(diffDays / 7)} недели` : `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays >= 30) {
    return date.toLocaleDateString(locale === "mk" ? "mk-MK" : "en-US", { month: "short", year: "numeric" });
  }
  return date.toLocaleDateString(locale === "mk" ? "mk-MK" : "en-US");
}

export function getListingConditionLabel(condition: ListingCondition, locale: Locale) {
  const labels: Record<ListingCondition, { en: string; mk: string }> = {
    NEW: { en: "New", mk: "Ново" },
    USED: { en: "Used", mk: "Користено" },
    REFURBISHED: { en: "Refurbished", mk: "Рефурбиширано" },
  };

  return labels[condition][locale];
}

/** Category-specific badge for cards: Jobs → Hiring, Real Estate → Rent/Sale, Services → Service; else condition (physical products). */
export function getListingCardBadge(
  categorySlug: string | null | undefined,
  parentSlug: string | null | undefined,
  condition: ListingCondition,
  locale: Locale,
  dealType?: "rent" | "sale" | null,
): { label: string; variant: "default" | "secondary" | "success" } {
  const parent = (parentSlug || categorySlug || "").toLowerCase();
  if (parent === "jobs") {
    return { label: locale === "mk" ? "Вработување" : "Hiring", variant: "success" };
  }
  if (parent === "real-estate") {
    const isSale = dealType === "sale" || (categorySlug || "").toLowerCase().includes("sale");
    return {
      label: isSale ? (locale === "mk" ? "Продажба" : "Sale") : (locale === "mk" ? "Наем" : "Rent"),
      variant: "default",
    };
  }
  if (parent === "services") {
    return { label: locale === "mk" ? "Услуга" : "Service", variant: "default" };
  }
  const label = getListingConditionLabel(condition, locale);
  return { label, variant: "secondary" };
}

export function ListingCardMedia({
  href,
  title,
  imageUrl,
  emptyLabel,
  price,
  showPrice = true,
  topLeft,
  topRight,
  sizes,
  imageClassName,
  roundedTopOnly = false,
}: {
  href: string;
  title: string;
  imageUrl?: string | null;
  emptyLabel: string;
  price?: string;
  showPrice?: boolean;
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  sizes: string;
  imageClassName?: string;
  roundedTopOnly?: boolean;
}) {
  const roundedClass = roundedTopOnly ? "rounded-t-xl" : "rounded-xl";
  return (
    <div className={cn("group/media relative aspect-[4/3] w-full overflow-hidden bg-muted", roundedClass)}>
      <Link href={href} className="absolute inset-0 z-10">
        <span className="sr-only">{title}</span>
      </Link>

      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={title}
          fill
          loading="lazy"
          quality={72}
          className={cn(
            "object-cover transition-transform duration-300 group-hover/media:scale-[1.03]",
            imageClassName,
          )}
          sizes={sizes}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.75),_transparent_55%),linear-gradient(135deg,rgba(226,232,240,0.95),rgba(241,245,249,0.9),rgba(203,213,225,0.95))] text-muted-foreground dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_50%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(15,23,42,0.98))]">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-background/85 ring-1 ring-black/10 dark:ring-white/10">
            <ImageOff size={18} />
          </span>
          <span className="text-xs font-medium">{emptyLabel}</span>
        </div>
      )}

      {topLeft ? <div className="absolute left-2.5 top-2.5 z-20 flex flex-wrap gap-2">{topLeft}</div> : null}
      {topRight ? (
        <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-2">{topRight}</div>
      ) : null}

      {showPrice && price ? (
        <div className="absolute inset-x-0 bottom-0 z-20 p-3">
          <div className="inline-flex max-w-full items-center rounded-full bg-background/92 px-3 py-1.5 text-lg font-semibold tracking-tight text-foreground shadow-[0_14px_30px_-22px_rgba(15,23,42,0.65)] ring-1 ring-black/5">
            <span className="truncate">{price}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ListingCardTag({
  children,
  variant = "secondary",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "success" | "warning" | "destructive";
  className?: string;
}) {
  return (
    <Badge
      variant={variant}
      className={cn("h-6 border-white/45 bg-background/92 px-2.5 text-[11px] shadow-sm", className)}
    >
      {children}
    </Badge>
  );
}

export function ListingCardMeta({
  items,
  className,
}: {
  items: Array<string | null | undefined | false>;
  className?: string;
}) {
  const filtered = items.filter(Boolean) as string[];
  if (filtered.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground", className)}>
      {filtered.map((item, index) => (
        <span key={`${item}-${index}`} className="truncate">
          {index > 0 ? <span className="mr-2 text-border">•</span> : null}
          {item}
        </span>
      ))}
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
