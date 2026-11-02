import type { PublicUser } from "@/lib/api";

// Mirrors the API's rule. The API is the authority (it also reserves a few
// names) — this is only for instant form feedback and for rejecting junk
// route params before they reach the API.
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

/** Public URL path for a user's profile. */
export function profilePath(username: string): string {
  return `/user/${username}`;
}

type ProfileNameFields = Pick<PublicUser, "name" | "username">;

export function profileDisplayName(user: ProfileNameFields): string {
  return user.name?.trim() || `@${user.username}`;
}

/** Up to two initials for the avatar fallback. */
export function profileInitials(user: ProfileNameFields): string {
  const source = user.name?.trim() || user.username;
  const words = source.split(/\s+/).filter(Boolean);
  const initials = words.length > 1 ? words[0][0] + words[words.length - 1][0] : source.slice(0, 2);
  return initials.toUpperCase();
}

export function profileLocation(user: Pick<PublicUser, "city" | "country">): string | null {
  return [user.city, user.country].filter(Boolean).join(", ") || null;
}
