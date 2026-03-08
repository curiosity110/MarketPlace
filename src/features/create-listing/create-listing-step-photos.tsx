"use client";

import type { RefObject } from "react";
import { PhotoGridUpload } from "@/features/create-listing/photo-grid-upload";

type Props = {
  heading: string;
  helperText: string;
  selectedPhotosLabel: string;
  addPhotosLabel: string;
  photoHint: string;
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
    <section className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-[1.9rem] font-semibold tracking-[-0.045em] text-foreground">
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground">{helperText}</p>
      </div>

      <PhotoGridUpload
        selectedPhotosLabel={selectedPhotosLabel}
        addPhotosLabel={addPhotosLabel}
        photoHint={photoHint}
        photoPreviewUrls={photoPreviewUrls}
        photoValidationError={photoValidationError}
        photosInputRef={photosInputRef}
        isActionBusy={isActionBusy}
        onPhotoChange={onPhotoChange}
      />
    </section>
  );
}
