"use server";

import { ListingCondition } from "@prisma/client";

export type ListingPhotoSuggestions = {
  suggestedTitle?: string;
  suggestedCategorySlug?: string;
  suggestedBrand?: string;
  suggestedModel?: string;
  suggestedYear?: string;
  suggestedCondition?: ListingCondition;
  suggestedDescription?: string;
};

export type AnalyzeListingPhotosResult =
  | {
      ok: true;
      suggestions: ListingPhotoSuggestions;
    }
  | {
      ok: false;
      error: string;
      suggestions: ListingPhotoSuggestions;
    };

export async function analyzeListingPhotos(
  formData: FormData,
): Promise<AnalyzeListingPhotosResult> {
  void formData;
  // TODO: keep this endpoint disabled until photo-based suggestions are reliably accurate.
  return {
    ok: true,
    suggestions: {},
  };
}
