"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  images: string[];
  thumbs?: string[];
};

export function ListingGallery({ images, thumbs }: Props) {
  const normalizedImages = useMemo(
    () => images.map((value) => value.trim()).filter(Boolean),
    [images],
  );
  const thumbnailSources = useMemo(() => {
    const source = thumbs && thumbs.length > 0 ? thumbs : normalizedImages;
    return source.map((value) => value.trim()).filter(Boolean).slice(0, 10);
  }, [thumbs, normalizedImages]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const safeActiveIndex =
    normalizedImages.length === 0
      ? 0
      : Math.min(activeIndex, normalizedImages.length - 1);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) =>
          prev <= 0 ? normalizedImages.length - 1 : prev - 1,
        );
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((prev) =>
          prev === normalizedImages.length - 1 ? 0 : prev + 1,
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isLightboxOpen, normalizedImages.length]);

  if (normalizedImages.length === 0) {
    return (
      <div className="flex aspect-[5/3] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        No photos uploaded
      </div>
    );
  }

  function goPrev() {
    setActiveIndex((prev) => (prev <= 0 ? normalizedImages.length - 1 : prev - 1));
  }

  function goNext() {
    setActiveIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
  }

  function openLightbox(index: number) {
    setActiveIndex(index);
    setIsLightboxOpen(true);
  }

  const currentImage = normalizedImages[safeActiveIndex];
  const overflowThumbCount = Math.max(0, normalizedImages.length - thumbnailSources.length);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => openLightbox(safeActiveIndex)}
        className="relative block w-full overflow-hidden rounded-xl border border-border/70 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="Open photo lightbox"
      >
        <div className="relative aspect-[16/10]">
          <Image
            src={currentImage}
            alt={`Listing photo ${safeActiveIndex + 1}`}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 720px"
          />
        </div>
      </button>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {thumbnailSources.map((thumbSrc, index) => {
          const isActive = index === activeIndex;
          const label = `Open image ${index + 1}`;
          const showOverflow = overflowThumbCount > 0 && index === thumbnailSources.length - 1;
          return (
            <button
              key={`${thumbSrc}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              onDoubleClick={() => openLightbox(index)}
              className={`relative overflow-hidden rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isActive
                  ? "border-primary ring-1 ring-primary/45"
                  : "border-border/70 hover:border-primary/40"
              }`}
              aria-label={label}
              title={label}
            >
              <div className="relative aspect-square">
                <Image
                  src={thumbSrc}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="80px"
                />
                {showOverflow && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-semibold text-white">
                    +{overflowThumbCount}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/80"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close lightbox"
          />

          <div className="relative z-[1] w-full max-w-5xl">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute right-2 top-2 z-[2] h-9 w-9 bg-background/90 p-0"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close lightbox"
            >
              <X size={16} />
            </Button>

            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-black">
              <div className="relative aspect-[16/10]">
                <Image
                  src={currentImage}
                  alt={`Listing photo ${safeActiveIndex + 1}`}
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            </div>

            {normalizedImages.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 bg-background/90 p-0"
                  onClick={goPrev}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 bg-background/90 p-0"
                  onClick={goNext}
                  aria-label="Next image"
                >
                  <ChevronRight size={18} />
                </Button>
              </>
            )}

            <p className="mt-2 text-center text-xs text-white/80">
              Image {safeActiveIndex + 1} of {normalizedImages.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
