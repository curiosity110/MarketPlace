"use client";

import Image from "next/image";
import { ImagePlus } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  photosLabel: string;
  photoHint: string;
  resetImagesLabel: string;
  isActionBusy: boolean;
  selectedPhotosCount: number;
  photoValidationError: string | null;
  photoPreviewUrls: string[];
  photosInputRef: RefObject<HTMLInputElement | null>;
  onClear: () => void;
  onChange: (files: FileList | null) => void;
};

export function CreateListingPhotoUploadSection({
  photosLabel,
  photoHint,
  resetImagesLabel,
  isActionBusy,
  selectedPhotosCount,
  photoValidationError,
  photoPreviewUrls,
  photosInputRef,
  onClear,
  onChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-tight">{photosLabel}</p>
          <p className="text-xs text-muted-foreground">{photoHint}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onClear}
          disabled={selectedPhotosCount === 0 || isActionBusy}
        >
          {resetImagesLabel}
        </Button>
      </div>
      <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/25 px-4 py-5 text-center transition-colors hover:border-primary/35 hover:bg-primary/5">
        <ImagePlus size={24} className="text-primary" />
        <span className="max-w-xs text-sm text-foreground">{selectedPhotosCount > 0 ? `${selectedPhotosCount}` : "+"}</span>
        <input
          ref={photosInputRef}
          name="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => onChange(event.target.files)}
          className="sr-only"
        />
      </label>
      {photoValidationError ? (
        <p className="text-xs font-medium text-destructive">{photoValidationError}</p>
      ) : null}
      {photoPreviewUrls.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photoPreviewUrls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/60"
            >
              <Image
                src={url}
                alt={`Selected photo ${index + 1}`}
                fill
                unoptimized
                sizes="112px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
