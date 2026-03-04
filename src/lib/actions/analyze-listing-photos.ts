"use server";

export type ListingPhotoSuggestions = {
  suggestedTitle?: string;
  suggestedCategorySlug?: string;
  suggestedBrand?: string;
  suggestedModel?: string;
  suggestedYear?: string;
  suggestedCondition?: "NEW" | "USED" | "REFURBISHED";
  suggestedDescription?: string;
};

export async function analyzeListingPhotos(
  files: File[],
): Promise<ListingPhotoSuggestions> {
  void files;

  // TODO: Replace with a real analyzer implementation behind a safe feature flag.
  // This placeholder intentionally returns suggestions only and never writes to DB.
  return {};
}
