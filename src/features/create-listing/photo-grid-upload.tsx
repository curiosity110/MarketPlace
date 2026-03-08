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
    <div className="space-y-5">
      <input
        ref={photosInputRef}
        type="file"
        name="photos"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(event) => onPhotoChange(event.currentTarget.files)}
        disabled={isActionBusy}
      />

      <div className="grid grid-cols-3 gap-3.5">
        <button
          type="button"
          onClick={() => photosInputRef.current?.click()}
          disabled={isActionBusy}
          className="group flex aspect-[0.82] min-h-[7.8rem] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-[#d5cbc0] bg-[#f6f1eb] p-4 text-center transition-colors hover:border-[#b5a493] hover:bg-[#f1ebe4] disabled:opacity-50"
        >
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-background text-[#8c7d70] ring-1 ring-border/50">
            {selectedCount > 0 ? <Plus size={18} /> : <Camera size={18} />}
          </div>
          <span className="text-sm font-medium text-foreground">{addPhotosLabel}</span>
          {selectedCount > 0 ? (
            <span className="mt-1 text-[0.8rem] text-[#74685c]">
              {selectedCount} {selectedPhotosLabel}
            </span>
          ) : null}
        </button>

        {slots.slice(0, TILE_COUNT - 1).map((url, index) =>
          url ? (
            <div
              key={`${url}-${index}`}
              className="relative aspect-[0.82] overflow-hidden rounded-[1.4rem] bg-[#e8e1d9]"
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
              className="aspect-[0.82] rounded-[1.4rem] bg-[#ece6df]"
              aria-hidden="true"
            />
          ),
        )}
      </div>

      {photoHint || photoValidationError ? (
        <div className="max-w-[28rem] space-y-1.5">
          {photoHint ? <p className="text-[0.92rem] leading-6 text-[#74685c]">{photoHint}</p> : null}
          {photoValidationError ? (
            <p className="text-sm text-destructive">{photoValidationError}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
