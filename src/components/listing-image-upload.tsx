"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  compressListingImages,
  LISTING_IMAGE_MAX_FILES,
} from "@/lib/images/compress";

type ExistingImage = {
  id: string;
  url: string;
};

type QueueImage = {
  file: File;
  previewUrl: string;
};

type Props = {
  listingId: string;
  existingImages: ExistingImage[];
  locale?: "en" | "mk";
};

function extractErrorFromResponseUrl(responseUrl: string | null) {
  if (!responseUrl) return null;
  try {
    const url = new URL(responseUrl);
    const error = url.searchParams.get("error");
    return error || null;
  } catch {
    return null;
  }
}

function extractErrorFromResponseText(responseText: string) {
  if (!responseText) return null;
  try {
    const parsed = JSON.parse(responseText) as
      | { error?: unknown; message?: unknown }
      | null;
    if (!parsed) return null;
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
    return null;
  } catch {
    return null;
  }
}

export function ListingImageUpload({
  listingId,
  existingImages,
  locale = "en",
}: Props) {
  const router = useRouter();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        selectPhotos: "Избери фотографии",
        clientCompression: `До ${LISTING_IMAGE_MAX_FILES} слики. Клиентска компресија: max ширина 1800px, квалитет 0.8, max 4MB по слика.`,
        readyToUpload: "Спремни за прикачување",
        uploading: "Прикачување...",
        uploadSelected: "Прикачи избрани",
        clear: "Исчисти",
        uploaded: "прикачено",
        currentImages: "Тековни слики",
        noImages: "Сè уште нема прикачени слики.",
        prepareImagesFailed: "Не може да се подготват избраните слики.",
        sessionExpired: "Сесијата ти е истечена. Најави се повторно.",
        uploadFailed: "Прикачувањето не успеа. Обиди се повторно.",
        networkError: "Мрежна грешка при прикачување.",
        fileFailedPrefix: "Сликата",
        fileFailedSuffix: "не успеа",
        uploadSuccess: "Сликите се прикачени успешно.",
      }
    : {
        selectPhotos: "Select photos",
        clientCompression: `Up to ${LISTING_IMAGE_MAX_FILES} images. Client compression: max width 1800px, quality 0.8, max 4MB each.`,
        readyToUpload: "Ready to upload",
        uploading: "Uploading...",
        uploadSelected: "Upload selected",
        clear: "Clear",
        uploaded: "uploaded",
        currentImages: "Current images",
        noImages: "No images uploaded yet.",
        prepareImagesFailed: "Could not prepare selected images.",
        sessionExpired: "Your session expired. Please log in again.",
        uploadFailed: "Upload failed. Please try again.",
        networkError: "Network error during upload.",
        fileFailedPrefix: "File",
        fileFailedSuffix: "failed",
        uploadSuccess: "Images uploaded successfully.",
      };
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [queue, setQueue] = useState<QueueImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      queue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [queue]);

  function replaceQueue(next: QueueImage[]) {
    setQueue((previous) => {
      previous.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return next;
    });
  }

  async function onSelectFiles(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(null);

    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      replaceQueue([]);
      return;
    }

    try {
      const compressed = await compressListingImages(files);
      const nextQueue = compressed.map((item) => ({
        file: item.file,
        previewUrl: URL.createObjectURL(item.file),
      }));
      replaceQueue(nextQueue);
    } catch (selectError) {
      const message =
        selectError instanceof Error
          ? selectError.message
          : text.prepareImagesFailed;
      setError(message);
      replaceQueue([]);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function uploadSingleFile(file: File, index: number, total: number) {
    return new Promise<void>((resolve, reject) => {
      const formData = new FormData();
      formData.append("listingId", listingId);
      formData.append("file", file, file.name);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || event.total === 0) return;
        const fileProgress = event.loaded / event.total;
        const overall = ((index + fileProgress) / total) * 100;
        setProgress(Math.round(overall));
      };

      xhr.onload = () => {
        const textError = extractErrorFromResponseText(xhr.responseText);
        const responseError = extractErrorFromResponseUrl(xhr.responseURL);
        const loginRedirected =
          typeof xhr.responseURL === "string" && xhr.responseURL.includes("/login");

        if (xhr.status >= 200 && xhr.status < 300 && !textError && !loginRedirected) {
          setProgress(Math.round(((index + 1) / total) * 100));
          resolve();
          return;
        }

        reject(
          new Error(
            textError ||
              responseError ||
              (loginRedirected
                ? text.sessionExpired
                : text.uploadFailed),
          ),
        );
      };

      xhr.onerror = () => reject(new Error(text.networkError));
      xhr.send(formData);
    });
  }

  async function onUpload() {
    if (queue.length === 0 || uploading) return;

    setError(null);
    setSuccess(null);
    setUploading(true);
    setProgress(0);

    try {
      for (let index = 0; index < queue.length; index += 1) {
        try {
          await uploadSingleFile(queue[index].file, index, queue.length);
        } catch (fileError) {
          const message =
            fileError instanceof Error
              ? fileError.message
              : text.uploadFailed;
          throw new Error(
            `${text.fileFailedPrefix} ${index + 1} ${text.fileFailedSuffix}: ${message}`,
          );
        }
      }

      setSuccess(text.uploadSuccess);
      replaceQueue([]);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : text.uploadFailed;
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">{text.selectPhotos}</span>
          <input
            ref={inputRef}
            id="listing-images-upload"
            name="listingImages"
            type="file"
            accept="image/*"
            multiple
            autoComplete="off"
            onChange={onSelectFiles}
            disabled={uploading}
            className="block w-full rounded-xl border border-border bg-input px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          {text.clientCompression}
        </p>
      </div>

      {queue.length > 0 && (
        <div className="rounded-xl border border-border/70 bg-card p-3">
          <p className="mb-2 text-sm font-semibold">
            {text.readyToUpload} ({queue.length})
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {queue.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="relative overflow-hidden rounded-lg border border-border/70 bg-muted/20"
              >
                <div className="relative aspect-square">
                  <Image
                    src={item.previewUrl}
                    alt={`Queued image ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="140px"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" onClick={onUpload} disabled={uploading}>
              {uploading ? text.uploading : text.uploadSelected}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => {
                replaceQueue([]);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              {text.clear}
            </Button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {progress}% {text.uploaded}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {success}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold">
          {text.currentImages} ({existingImages.length})
        </p>
        {existingImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {existingImages.map((image) => (
              <a
                key={image.id}
                href={image.url}
                target="_blank"
                rel="noreferrer"
                className="relative block overflow-hidden rounded-lg border border-border/70 bg-muted/20"
              >
                <div className="relative aspect-square">
                  <Image
                    src={image.url}
                    alt="Uploaded listing image"
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="140px"
                  />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{text.noImages}</p>
        )}
      </div>
    </div>
  );
}
