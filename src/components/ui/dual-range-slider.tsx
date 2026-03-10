"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const STEP = 5000;
const MIN_GAP = STEP * 2;

type Props = {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  maxBound: number;
  step?: number;
  formatValue: (n: number) => string;
  onChange: (min: number, max: number) => void;
  className?: string;
};

export function DualRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  maxBound,
  step = STEP,
  formatValue,
  onChange,
  className,
}: Props) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState<"min" | "max" | null>(null);
  const valuesRef = React.useRef({ valueMin: 0, valueMax: maxBound });

  const clamp = (v: number) => Math.min(maxBound, Math.max(0, Math.round(v / step) * step));
  const pct = (v: number) => (v / maxBound) * 100;

  const valueMinClamped = clamp(valueMin);
  const valueMaxClamped = Math.max(valueMinClamped + MIN_GAP, clamp(valueMax));
  valuesRef.current = { valueMin: valueMinClamped, valueMax: valueMaxClamped };

  const handleMove = React.useCallback(
    (clientX: number, which: "min" | "max") => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const value = Math.round((x * maxBound) / step) * step;
      const clamped = clamp(value);
      const { valueMin: vMin, valueMax: vMax } = valuesRef.current;
      if (which === "min") {
        const newMin = Math.min(clamped, vMax - MIN_GAP);
        onChange(newMin, vMax);
      } else {
        const newMax = Math.max(clamped, vMin + MIN_GAP);
        onChange(vMin, newMax);
      }
    },
    [maxBound, step, onChange],
  );

  React.useEffect(() => {
    if (dragging === null) return;
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, dragging);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches[0]) handleMove(e.touches[0].clientX, dragging);
    };
    const onEnd = () => setDragging(null);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [dragging, handleMove]);

  const leftPct = pct(valueMinClamped);
  const rightPct = 100 - pct(valueMaxClamped);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-center text-sm font-medium text-foreground tabular-nums">
        {formatValue(valueMinClamped)} — {formatValue(valueMaxClamped)}
      </p>
      <div
        ref={trackRef}
        className="relative h-8 w-full touch-none"
        aria-label="Price range"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="h-1.5 w-full rounded-full bg-muted" />
          <div
            className="absolute h-1.5 rounded-full bg-orange-500 transition-[left,right] duration-75"
            style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
          />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={valueMaxClamped}
          aria-valuenow={valueMinClamped}
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 cursor-grab rounded-full border-2 border-orange-500 bg-background shadow-md active:cursor-grabbing"
          style={{ left: `calc(${leftPct}% - 10px)` }}
          onMouseDown={() => setDragging("min")}
          onTouchStart={() => setDragging("min")}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-valuemin={valueMinClamped}
          aria-valuemax={maxBound}
          aria-valuenow={valueMaxClamped}
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 cursor-grab rounded-full border-2 border-orange-500 bg-background shadow-md active:cursor-grabbing"
          style={{ left: `calc(${100 - rightPct}% - 10px)` }}
          onMouseDown={() => setDragging("max")}
          onTouchStart={() => setDragging("max")}
        />
      </div>
    </div>
  );
}
