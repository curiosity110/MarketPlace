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
      <div className="relative overflow-hidden rounded-[1.35rem] border border-border/30 bg-[radial-gradient(900px_320px_at_10%_-10%,rgba(228,120,62,.05),transparent_60%),radial-gradient(720px_280px_at_90%_-10%,rgba(102,128,168,.05),transparent_60%)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(120,120,120,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,120,120,.08)_1px,transparent_1px)] [background-size:26px_26px]" />

        <div className="relative px-3.5 py-2.5 sm:px-6 lg:px-8">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-lg border border-primary/12 bg-background/72 shadow-sm">
                <span className="absolute -inset-1 rounded-[14px] bg-gradient-to-br from-orange-500/12 to-blue-500/12 blur-md" />
                <Flame size={14} className="relative text-primary" />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {title}
              </p>
            </div>

            <Link href="/browse" className="shrink-0">
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px]">
                {browseAllLabel} <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background via-background/60 to-transparent" />

            <div
              className={cn(
                "absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 transition-opacity duration-200 md:block",
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
                "absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 transition-opacity duration-200 md:block",
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
              className="flex gap-2 overflow-x-auto py-0.5 pr-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory overscroll-x-contain"
            >
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="snap-start"
                  prefetch={false}
                >
                  <div className="group relative inline-flex min-w-[144px] items-center gap-2 rounded-[1rem] border border-border/50 bg-background/72 p-2.25 backdrop-blur transition-all duration-200 shadow-[0_0_0_1px_rgba(0,0,0,.02)] hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-md">
                    <span
                      className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] border border-border/55"
                      style={{ backgroundImage: gradientFor(item.id) }}
                      aria-hidden="true"
                    >
                      <span className="absolute inset-0 rounded-[1rem] bg-gradient-to-br from-white/40 to-transparent" />
                      <span className="relative h-2.5 w-2.5 rounded-full bg-foreground/70" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold">{item.label}</p>
                      {item.hint ? (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {item.hint}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.9rem] border border-border/55 bg-background/70 transition-all duration-200 group-hover:border-primary/22 group-hover:shadow-sm"
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
                <div className="group relative inline-flex min-w-[164px] items-center gap-2 rounded-[1rem] border border-primary/14 bg-primary/5 p-2.25 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/24 hover:shadow-md">
                  <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[1rem] border border-primary/18 bg-background/70">
                    <span className="absolute -inset-1 rounded-[14px] bg-primary/10 blur-md" />
                    <ArrowRight size={16} className="relative text-primary" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold">{browseAllLabel}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {items.length}+ more
                    </p>
                  </div>

                  <span
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[1rem] border border-primary/18 bg-background/70 transition-all duration-200 group-hover:border-primary/35"
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

            <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-muted/25">
              <div
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-orange-500/30 via-primary/30 to-blue-500/30"
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
