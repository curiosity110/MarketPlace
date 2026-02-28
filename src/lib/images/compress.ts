"use client";

export const LISTING_IMAGE_MAX_FILES = 10;
export const LISTING_IMAGE_MAX_WIDTH = 1800;
export const LISTING_IMAGE_MAX_OUTPUT_BYTES = 4 * 1024 * 1024; // 4MB
export const LISTING_IMAGE_QUALITY = 0.8;
export const LISTING_IMAGE_THUMB_MAX_WIDTH = 600;

type CompressOptions = {
  maxFiles?: number;
  maxWidth?: number;
  quality?: number;
  maxOutputBytes?: number;
  generateThumbnails?: boolean;
  thumbMaxWidth?: number;
};

export type CompressedImageResult = {
  file: File;
  width: number;
  height: number;
  thumb?: File;
};

function getBaseName(fileName: string) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return sanitized.replace(/\.[^.]+$/, "") || "image";
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not read image: ${file.name}`));
    };
    image.src = objectUrl;
  });
}

function drawToCanvas(image: HTMLImageElement, maxWidth: number) {
  const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image compression failed: Canvas is not available.");
  }

  context.drawImage(image, 0, 0, width, height);
  return { canvas, width, height };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function encodeCanvasImage(
  canvas: HTMLCanvasElement,
  quality: number,
  nameBase: string,
) {
  const webpBlob = await canvasToBlob(canvas, "image/webp", quality);
  if (webpBlob) {
    return {
      file: new File([webpBlob], `${nameBase}.webp`, { type: "image/webp" }),
      mime: "image/webp",
    };
  }

  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", quality);
  if (!jpegBlob) {
    throw new Error("Image compression failed while encoding.");
  }

  return {
    file: new File([jpegBlob], `${nameBase}.jpg`, { type: "image/jpeg" }),
    mime: "image/jpeg",
  };
}

export async function compressListingImages(
  files: File[],
  options: CompressOptions = {},
): Promise<CompressedImageResult[]> {
  const maxFiles = options.maxFiles ?? LISTING_IMAGE_MAX_FILES;
  const maxWidth = options.maxWidth ?? LISTING_IMAGE_MAX_WIDTH;
  const quality = options.quality ?? LISTING_IMAGE_QUALITY;
  const maxOutputBytes = options.maxOutputBytes ?? LISTING_IMAGE_MAX_OUTPUT_BYTES;
  const thumbMaxWidth = options.thumbMaxWidth ?? LISTING_IMAGE_THUMB_MAX_WIDTH;
  const generateThumbnails = options.generateThumbnails ?? false;

  if (files.length === 0) return [];

  if (files.length > maxFiles) {
    throw new Error(`You can upload up to ${maxFiles} photos at once.`);
  }

  const compressed: CompressedImageResult[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`"${file.name}" is not an image file.`);
    }

    const image = await loadImage(file);
    const { canvas, width, height } = drawToCanvas(image, maxWidth);
    const baseName = getBaseName(file.name);
    const encoded = await encodeCanvasImage(canvas, quality, baseName);

    if (encoded.file.size > maxOutputBytes) {
      throw new Error(
        `"${file.name}" is still larger than 4MB after compression. Please choose a smaller image.`,
      );
    }

    let thumbFile: File | undefined;
    if (generateThumbnails) {
      const thumbCanvas = drawToCanvas(image, thumbMaxWidth).canvas;
      const thumbEncoded = await encodeCanvasImage(thumbCanvas, quality, `${baseName}-thumb`);
      thumbFile = thumbEncoded.file;
    }

    compressed.push({
      file: encoded.file,
      width,
      height,
      thumb: thumbFile,
    });
  }

  return compressed;
}
