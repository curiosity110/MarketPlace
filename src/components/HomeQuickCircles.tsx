"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type QuickItem = {
  id: string;
  label: string;
  hint?: string;
  href: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function gradientFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + (h % 50)) % 360;
  return `linear-gradient(135deg, hsl(${hue1} 92% 58% / .16), hsl(${hue2} 92% 58% / .14))`;
}

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
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [railProgressPct, setRailProgressPct] = React.useState(0);

  const updateCanScroll = React.useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < max - 2);
    const progress = max > 0 ? (el.scrollLeft / max) * 200 : 0;
    setRailProgressPct(clamp(progress, 0, 200));
  }, []);

  React.useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    updateCanScroll();

    const onScroll = () => updateCanScroll();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateCanScroll());
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [items.length, updateCanScroll]);

  const scrollByCards = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const by = clamp(Math.round(el.clientWidth * 0.75), 240, 720);
    el.scrollBy({ left: dir * by, behavior: "smooth" });
  };

  return (
    <section
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative overflow-hidden rounded-[1.9rem] border border-border/45 bg-[radial-gradient(1200px_400px_at_10%_-10%,rgba(228,120,62,.12),transparent_60%),radial-gradient(900px_420px_at_90%_-10%,rgba(102,128,168,.12),transparent_60%)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(to_right,rgba(120,120,120,.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,120,120,.10)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-primary/20 bg-background/70 shadow-sm">
                <span className="absolute -inset-1 rounded-[18px] bg-gradient-to-br from-orange-500/20 to-blue-500/20 blur-md" />
                <Flame size={16} className="relative text-primary" />
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

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background via-background/60 to-transparent" />

            <div
              className={cn(
                "absolute left-2 top-1/2 z-10 -translate-y-1/2 transition-opacity duration-200",
                isHovering && canLeft ? "opacity-100" : "opacity-0",
              )}
            >
              <button
                type="button"
                onClick={() => scrollByCards(-1)}
                className="group inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm backdrop-blur hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </button>
            </div>

            <div
              className={cn(
                "absolute right-2 top-1/2 z-10 -translate-y-1/2 transition-opacity duration-200",
                isHovering && canRight ? "opacity-100" : "opacity-0",
              )}
            >
              <button
                type="button"
                onClick={() => scrollByCards(1)}
                className="group inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm backdrop-blur hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </button>
            </div>

            <div
              ref={railRef}
              className="flex gap-2 overflow-x-auto py-1 pr-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory overscroll-x-contain"
            >
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="snap-start"
                  prefetch={false}
                >
                  <div className="group relative inline-flex min-w-[168px] items-center gap-3 rounded-2xl border border-border/70 bg-background/75 p-3 backdrop-blur transition-all duration-200 shadow-[0_0_0_1px_rgba(0,0,0,.02)] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
                    <span
                      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/70"
                      style={{ backgroundImage: gradientFor(item.id) }}
                      aria-hidden="true"
                    >
                      <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent" />
                      <span className="relative h-2.5 w-2.5 rounded-full bg-foreground/70" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.label}</p>
                      {item.hint ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {item.hint}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/70 transition-all duration-200 group-hover:border-primary/25 group-hover:shadow-sm"
                      aria-hidden="true"
                    >
                      <ArrowRight
                        size={16}
                        className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                      />
                    </span>
                  </div>
                </Link>
              ))}

              <Link href="/browse" className="snap-start shrink-0" prefetch={false}>
                <div className="group relative inline-flex min-w-[190px] items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-background/70">
                    <span className="absolute -inset-1 rounded-[18px] bg-primary/10 blur-md" />
                    <ArrowRight size={16} className="relative text-primary" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{browseAllLabel}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {items.length}+ more
                    </p>
                  </div>

                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-background/70 transition-all duration-200 group-hover:border-primary/35"
                    aria-hidden="true"
                  >
                    <ArrowRight
                      size={16}
                      className="text-primary transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            </div>

            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-orange-500/40 via-primary/40 to-blue-500/40"
                style={{
                  transform: `translateX(${railProgressPct}%)`,
                  transition: "transform 120ms linear",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
