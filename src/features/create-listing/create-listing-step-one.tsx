"use client";

import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { localizeCategoryName } from "@/lib/category-label";
import type { CreateListingCategoryOption } from "@/features/create-listing/types";

type Props = {
  title: string;
  categoryPathLabel?: string;
  titlePlaceholder: string;
  categoryLabel: string;
  categorySearchLabel: string;
  categorySearchPlaceholder: string;
  categoryRequiredLabel: string;
  noCategoryMatchLabel: string;
  selectedPhotosLabel: string;
  addPhotosLabel: string;
  photoPreviewUrls: string[];
  photoValidationError: string | null;
  photosInputRef: React.RefObject<HTMLInputElement | null>;
  titleValue: string;
  categorySearch: string;
  selectedCategoryId: string;
  categoryOptions: CreateListingCategoryOption[];
  categoryError: string | null;
  isActionBusy: boolean;
  locale: "en" | "mk";
  onPhotoChange: (files: FileList | null) => void;
  onPhotosClear: () => void;
  onTitleChange: (value: string) => void;
  onCategorySearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onQuickFillClick?: () => void;
};

export function CreateListingStepOne({
  title,
  titlePlaceholder,
  categoryLabel,
  categorySearchLabel,
  categorySearchPlaceholder,
  categoryRequiredLabel,
  noCategoryMatchLabel,
  selectedPhotosLabel,
  addPhotosLabel,
  photoPreviewUrls,
  photoValidationError,
  photosInputRef,
  titleValue,
  categorySearch,
  selectedCategoryId,
  categoryOptions,
  categoryError,
  isActionBusy,
  locale,
  onPhotoChange,
  onPhotosClear,
  onTitleChange,
  onCategorySearchChange,
  onCategoryChange,
  onQuickFillClick,
}: Props) {
  const filtered = categorySearch
    ? categoryOptions.filter((cat) =>
        localizeCategoryName(cat, locale)
          .toLowerCase()
          .includes(categorySearch.toLowerCase()),
      )
    : categoryOptions;

  const selectedCat = categoryOptions.find((c) => c.id === selectedCategoryId);
  const categoryPath = selectedCat ? localizeCategoryName(selectedCat, locale) : "";

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-3 block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Photos
          </span>
        </label>

        {photoPreviewUrls.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photoPreviewUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-square overflow-hidden rounded-[1.1rem] bg-muted"
              >
                <Image
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            ref={photosInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => onPhotoChange(e.currentTarget.files)}
            disabled={isActionBusy}
          />

          <button
            type="button"
            onClick={() => photosInputRef.current?.click()}
            disabled={isActionBusy}
            className="w-full rounded-[1.4rem] border border-dashed border-border/60 bg-card/60 px-4 py-8 transition-colors hover:border-border disabled:opacity-50"
          >
            <ImagePlus className="mx-auto mb-2 text-muted-foreground" size={24} />
            <p className="text-sm font-medium text-foreground">
              {photoPreviewUrls.length > 0
                ? `${photoPreviewUrls.length} ${selectedPhotosLabel}`
                : addPhotosLabel}
            </p>
          </button>

          {photoValidationError && (
            <p className="mt-2 text-xs text-destructive">{photoValidationError}</p>
          )}

          {photoPreviewUrls.length > 0 && (
            <button
              type="button"
              onClick={onPhotosClear}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear photos
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
          <Input
            name="title"
            value={titleValue}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={titlePlaceholder}
            required
            disabled={isActionBusy}
            className="h-12"
          />
        </label>
      </div>

      <div>
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {categoryLabel}
          </span>

          <Input
            value={categorySearch}
            onChange={(e) => onCategorySearchChange(e.target.value)}
            placeholder={categorySearchPlaceholder}
            disabled={isActionBusy}
            className="h-12"
          />

          {categorySearch || categoryOptions.length < 10 ? (
            <div className="max-h-48 overflow-y-auto rounded-[1.3rem] border border-border/55 bg-card/60">
              {filtered.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground text-center">
                  {noCategoryMatchLabel}
                </div>
              ) : (
                <div className="divide-y divide-border/25">
                  {filtered.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        onCategoryChange(category.id);
                        onCategorySearchChange("");
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted/40 ${
                        selectedCategoryId === category.id
                          ? "bg-primary/10 text-primary font-medium"
                          : ""
                      }`}
                    >
                      {localizeCategoryName(category, locale)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <select
              value={selectedCategoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              disabled={isActionBusy}
              className="h-12 w-full rounded-full border border-border/55 bg-card px-4 py-2 text-sm"
            >
              <option value="">{categoryLabel}</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {localizeCategoryName(category, locale)}
                </option>
              ))}
            </select>
          )}

          {categoryError && (
            <p className="text-xs text-destructive">{categoryError}</p>
          )}

          {selectedCategoryId && categoryPath && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{categoryPath}</span>
            </p>
          )}
        </label>
      </div>
    </div>
  );
}
