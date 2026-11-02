import type { SupabaseClient } from "@supabase/supabase-js";
import { LISTING_PHOTOS_BUCKET } from "@/lib/supabase/listing-photos";

// Profile and cover pictures live in the same bucket as listing photos, in a
// `profile/` folder inside the user's own `<supabase user id>/` folder — the
// bucket policies and the API's URL check only accept files under that
// user folder.
export const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;

export type ProfilePhotoKind = "avatar" | "cover";

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const ACCEPTED_PROFILE_PHOTO_TYPES = Object.keys(EXTENSION_BY_TYPE).join(",");

/** Returns a user-facing error message, or null if the file is acceptable. */
export function validateProfilePhoto(file: File): string | null {
  if (!EXTENSION_BY_TYPE[file.type]) {
    return "Only JPEG, PNG, WebP and GIF images are allowed.";
  }
  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    return "Images must be 2 MB or smaller.";
  }
  return null;
}

export async function uploadProfilePhoto(
  supabase: SupabaseClient,
  supabaseUserId: string,
  kind: ProfilePhotoKind,
  file: File,
): Promise<{ path: string; url: string }> {
  // A fresh name per upload, so browsers and CDNs never serve a stale image.
  const path = `${supabaseUserId}/profile/${kind}-${crypto.randomUUID()}.${EXTENSION_BY_TYPE[file.type]}`;
  const { error } = await supabase.storage
    .from(LISTING_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}
