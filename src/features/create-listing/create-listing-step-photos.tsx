"use client";

import type { RefObject } from "react";
import { PhotoGridUpload } from "@/features/create-listing/photo-grid-upload";

type Props = {
  heading: string;
  helperText?: string;
  selectedPhotosLabel: string;
  addPhotosLabel: string;
  photoHint?: string;
  photoPreviewUrls: string[];
  photoValidationError: string | null;
  photosInputRef: RefObject<HTMLInputElement | null>;
  isActionBusy: boolean;
  onPhotoChange: (files: FileList | null) => void;
};

export function CreateListingStepPhotos({
  heading,
  helperText,
  selectedPhotosLabel,
  addPhotosLabel,
  photoHint,
  photoPreviewUrls,
  photoValidationError,
  photosInputRef,
  isActionBusy,
  onPhotoChange,
}: Props) {
  return (
    <section className="space-y-7">
      <div className="max-w-[28rem] space-y-2">
        <h2 className="text-[1.85rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[1.95rem]">
          {heading}
        </h2>
        {helperText ? (
          <p className="text-[0.95rem] leading-6 text-[#74685c]">{helperText}</p>
        ) : null}
      </div>

      <PhotoGridUpload
        selectedPhotosLabel={selectedPhotosLabel}
        addPhotosLabel={addPhotosLabel}
        photoHint={photoHint ?? ""}
        photoPreviewUrls={photoPreviewUrls}
        photoValidationError={photoValidationError}
        photosInputRef={photosInputRef}
        isActionBusy={isActionBusy}
        onPhotoChange={onPhotoChange}
      />
    </section>
  );
}
