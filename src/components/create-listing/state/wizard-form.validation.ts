import {
  MAX_CREATE_PHOTOS,
  MAX_CREATE_SINGLE_FILE_SIZE,
  MAX_CREATE_TOTAL_FILE_SIZE,
} from "@/components/create-listing/constants";

export function validateCreateListingPhotos(
  files: FileList | null,
  text: {
    photosCountError: string;
    photosSingleSizeError: string;
    photosTotalSizeError: string;
  },
) {
  if (!files || files.length === 0) return null;
  if (files.length > MAX_CREATE_PHOTOS) return text.photosCountError;

  let totalBytes = 0;
  for (const file of Array.from(files)) {
    totalBytes += file.size;
    if (file.size > MAX_CREATE_SINGLE_FILE_SIZE) {
      return text.photosSingleSizeError;
    }
  }

  if (totalBytes > MAX_CREATE_TOTAL_FILE_SIZE) {
    return text.photosTotalSizeError;
  }

  return null;
}
