'use client';

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACCEPTED_PHOTO_TYPES,
  MAX_LISTING_PHOTOS,
  uploadListingPhoto,
  validatePhotoFile,
} from "@/lib/supabase/listing-photos";

export type PhotoItem = {
  key: string;
  /** Public URL once uploaded (or for photos the listing already had). */
  url?: string;
  altText: string;
  status: "ready" | "uploading" | "error";
  error?: string;
  /** Kept so a failed upload can be retried. */
  file?: File;
  /** Local object URL shown while uploading / after a failed upload. */
  previewUrl?: string;
};

type PhotoManagerProps = {
  photos: PhotoItem[];
  setPhotos: Dispatch<SetStateAction<PhotoItem[]>>;
  supabase: SupabaseClient;
  supabaseUserId: string;
  listingId: string;
  /** Called with the storage path of every file uploaded this session. */
  onUploaded: (path: string) => void;
};

export function PhotoManager({
  photos,
  setPhotos,
  supabase,
  supabaseUserId,
  listingId,
  onUploaded,
}: PhotoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  const update = (key: string, patch: Partial<PhotoItem>) =>
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const upload = async (key: string, file: File) => {
    update(key, { status: "uploading", error: undefined });
    try {
      const { path, url } = await uploadListingPhoto(supabase, supabaseUserId, listingId, file);
      onUploaded(path);
      setPhotos((prev) =>
        prev.map((p) => {
          if (p.key !== key) return p;
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
          return { ...p, url, status: "ready", file: undefined, previewUrl: undefined };
        }),
      );
    } catch (error) {
      update(key, {
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const errors: string[] = [];
    const room = MAX_LISTING_PHOTOS - photos.length;

    const accepted = files.filter((file) => {
      const error = validatePhotoFile(file);
      if (error) errors.push(error);
      return !error;
    });
    if (accepted.length > room) {
      errors.push(`A listing can have at most ${MAX_LISTING_PHOTOS} photos.`);
      accepted.splice(Math.max(room, 0));
    }
    setPickError(errors.length > 0 ? errors.join(" ") : null);

    const items: PhotoItem[] = accepted.map((file) => ({
      key: crypto.randomUUID(),
      altText: "",
      status: "uploading",
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...items]);
    items.forEach((item) => upload(item.key, item.file!));
  };

  const remove = (key: string) =>
    setPhotos((prev) => {
      const photo = prev.find((p) => p.key === key);
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((p) => p.key !== key);
    });

  const move = (index: number, delta: number) =>
    setPhotos((prev) => {
      const next = [...prev];
      const [photo] = next.splice(index, 1);
      next.splice(index + delta, 0, photo);
      return next;
    });

  return (
    <div className="space-y-4">
      {photos.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <li key={photo.key} className="rounded-md border border-border overflow-hidden bg-card">
              <div className="relative aspect-[4/3] bg-muted">
                <img
                  src={photo.url ?? photo.previewUrl}
                  alt={photo.altText || `Photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-background">
                    Cover
                  </span>
                )}
                {photo.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <Loader2 className="h-6 w-6 animate-spin text-foreground" aria-label="Uploading" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-2 h-7 w-7"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => remove(photo.key)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 p-2">
                {photo.status === "error" && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-destructive" role="alert">{photo.error ?? "Upload failed"}</p>
                    {photo.file && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0"
                        onClick={() => upload(photo.key, photo.file!)}
                      >
                        <RotateCw className="mr-1 h-3 w-3" /> Retry
                      </Button>
                    )}
                  </div>
                )}
                <Input
                  value={photo.altText}
                  onChange={(e) => update(photo.key, { altText: e.target.value })}
                  placeholder="Alt text (optional)"
                  aria-label={`Alt text for photo ${index + 1}`}
                  className="h-8 text-xs"
                />
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Move photo ${index + 1} earlier`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Move photo ${index + 1} later`}
                    disabled={index === photos.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_PHOTO_TYPES}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={photos.length >= MAX_LISTING_PHOTOS}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" /> Add photos
        </Button>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG or WebP, up to 5 MB each. {photos.length}/{MAX_LISTING_PHOTOS} photos. The first photo is the cover.
        </p>
      </div>
      {pickError && <p className="text-sm text-destructive" role="alert">{pickError}</p>}
    </div>
  );
}
