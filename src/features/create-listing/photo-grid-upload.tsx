"use client";

import type { RefObject } from "react";
import Image from "next/image";
import { Camera, Plus } from "lucide-react";

type Props = {
  selectedPhotosLabel: string;
  addPhotosLabel: string;
  photoHint: string;
  photoPreviewUrls: string[];
  photoValidationError: string | null;
  photosInputRef: RefObject<HTMLInputElement | null>;
  isActionBusy: boolean;
  onPhotoChange: (files: FileList | null) => void;
};

const TILE_COUNT = 6;

export function PhotoGridUpload({
  selectedPhotosLabel,
  addPhotosLabel,
  photoHint,
  photoPreviewUrls,
  photoValidationError,
  photosInputRef,
  isActionBusy,
  onPhotoChange,
}: Props) {
  const slots = Array.from({ length: TILE_COUNT }, (_, index) => photoPreviewUrls[index] ?? null);
  const selectedCount = photoPreviewUrls.length;

  return (
    <div className="space-y-4">
      <input
        ref={photosInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(event) => onPhotoChange(event.currentTarget.files)}
        disabled={isActionBusy}
      />

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => photosInputRef.current?.click()}
          disabled={isActionBusy}
          className="group flex aspect-[0.82] flex-col items-center justify-center rounded-[1.45rem] border border-dashed border-border/60 bg-card/50 p-4 text-center transition-colors hover:border-foreground/20 hover:bg-card disabled:opacity-50"
        >
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border/50">
            {selectedCount > 0 ? <Plus size={18} /> : <Camera size={18} />}
          </div>
          <span className="text-sm font-medium text-foreground">{addPhotosLabel}</span>
          {selectedCount > 0 ? (
            <span className="mt-1 text-xs text-muted-foreground">
              {selectedCount} {selectedPhotosLabel}
            </span>
          ) : null}
        </button>

        {slots.slice(0, TILE_COUNT - 1).map((url, index) =>
          url ? (
            <div
              key={`${url}-${index}`}
              className="relative aspect-[0.82] overflow-hidden rounded-[1.45rem] bg-muted"
            >
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 30vw, 160px"
              />
            </div>
          ) : (
            <div
              key={`empty-${index}`}
              className="aspect-[0.82] rounded-[1.45rem] bg-muted/55"
              aria-hidden="true"
            />
          ),
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">{photoHint}</p>
        {photoValidationError ? (
          <p className="text-sm text-destructive">{photoValidationError}</p>
        ) : null}
      </div>
    </div>
  );
}
