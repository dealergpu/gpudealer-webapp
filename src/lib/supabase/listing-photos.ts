import type { SupabaseClient } from "@supabase/supabase-js";

// Listing photos are uploaded by the browser straight to Supabase Storage;
// the API only stores the resulting public URLs. Bucket policies (and the
// API's URL check) only accept files inside the uploader's own
// `<supabase user id>/` folder.
export const LISTING_PHOTOS_BUCKET = "gpu-pics";
export const MAX_LISTING_PHOTOS = 20;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ACCEPTED_PHOTO_TYPES = Object.keys(EXTENSION_BY_TYPE).join(",");

/** Returns a user-facing error message, or null if the file is acceptable. */
export function validatePhotoFile(file: File): string | null {
  if (!EXTENSION_BY_TYPE[file.type]) {
    return `${file.name}: only JPEG, PNG and WebP images are allowed.`;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return `${file.name}: images must be 5 MB or smaller.`;
  }
  return null;
}

export async function uploadListingPhoto(
  supabase: SupabaseClient,
  supabaseUserId: string,
  listingId: string,
  file: File,
): Promise<{ path: string; url: string }> {
  const path = `${supabaseUserId}/${listingId}/${crypto.randomUUID()}.${EXTENSION_BY_TYPE[file.type]}`;
  const { error } = await supabase.storage
    .from(LISTING_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

/** The storage path of a public gpu-pics URL, or null for any other URL. */
export function photoPathFromUrl(url: string): string | null {
  const marker = `/object/public/${LISTING_PHOTOS_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

/** Best-effort delete — a failed cleanup must never block the user. */
export async function removeListingPhotos(supabase: SupabaseClient, paths: string[]) {
  if (paths.length === 0) return;
  try {
    await supabase.storage.from(LISTING_PHOTOS_BUCKET).remove(paths);
  } catch (error) {
    console.error("Failed to clean up listing photos", error);
  }
}
