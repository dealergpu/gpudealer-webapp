import type { Listing } from "@/lib/api";

/** Public URL path for a listing. Always built from the API's `slug`, never the title. */
export function listingPath(listing: Pick<Listing, "slug">): string {
  return `/listing/${listing.slug}`;
}
