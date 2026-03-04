import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type QuickItem = {
  id: string;
  label: string;
  hint?: string;
  href: string;
};

export function HomeQuickCircles({
  title,
  browseAllLabel,
  items,
  className,
}: {
  title: string;
  browseAllLabel: string;
  items: QuickItem[];
  className?: string;
}) {
  return (
    <section
      className={cn(
        // full-bleed surface (looks like a site-wide rail)
        "relative -mx-4 sm:-mx-6 lg:-mx-10",
        className,
      )}
    >
      <div className="border-y border-border/70 bg-gradient-to-r from-orange-50/70 via-background to-blue-50/70 dark:from-orange-950/20 dark:via-background dark:to-blue-950/20">
        <div className="px-4 sm:px-6 lg:px-10 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-primary/20 bg-background/70 shadow-sm">
                <Flame size={16} className="text-primary" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
            </div>

            <Link href="/browse" className="shrink-0">
              <Button variant="ghost" size="sm" className="gap-1">
                {browseAllLabel} <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          {/* scroll rail */}
          <div className="relative">
            {/* fade edges so it feels premium */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />

            <div
              className={cn(
                "flex gap-2 overflow-x-auto py-1",
                "scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]",
                "[&::-webkit-scrollbar]:hidden",
                "snap-x snap-mandatory",
              )}
            >
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="snap-start"
                  prefetch={false}
                >
                  <div
                    className={cn(
                      "group inline-flex min-w-[140px] items-center justify-between gap-3 rounded-2xl border",
                      "border-border/70 bg-background/80 px-3 py-2",
                      "transition-all duration-200",
                      "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
                      "active:translate-y-0",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {item.label}
                      </p>
                      {item.hint ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {item.hint}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
                        "border-border/70 bg-gradient-to-br from-orange-50 to-blue-50",
                        "dark:from-orange-950/20 dark:to-blue-950/20",
                        "transition-all duration-200",
                        "group-hover:border-primary/25 group-hover:shadow-sm",
                      )}
                      aria-hidden="true"
                    >
                      <ArrowRight size={16} className="text-muted-foreground" />
                    </span>
                  </div>
                </Link>
              ))}

              {/* optional “Browse all” chip at the end (feels intentional) */}
              <Link href="/browse" className="snap-start shrink-0" prefetch={false}>
                <div
                  className={cn(
                    "inline-flex min-w-[170px] items-center justify-between gap-3 rounded-2xl border",
                    "border-primary/20 bg-primary/5 px-3 py-2",
                    "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{browseAllLabel}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {items.length}+ {/** subtle “more” feel */}
                      {/** keep language-neutral */}
                      more
                    </p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-background/70">
                    <ArrowRight size={16} className="text-primary" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}