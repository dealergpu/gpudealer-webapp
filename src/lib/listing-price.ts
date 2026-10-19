import type { Listing } from "@/lib/api";

export const PRICE_ON_REQUEST = "Price on request";

/** True when the listing has a usable asking price (`price` is a decimal string, or null). */
export function hasListingPrice(listing: Pick<Listing, "price">): boolean {
  return listing.price != null && listing.price !== "" && Number.isFinite(Number(listing.price));
}

/** Formats `price` in the listing's own currency, or "Price on request" when there is none. */
export function formatListingPrice(
  listing: Pick<Listing, "price" | "currency">,
  maximumFractionDigits?: number,
): string {
  if (!hasListingPrice(listing)) return PRICE_ON_REQUEST;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: listing.currency || "USD",
    maximumFractionDigits,
  }).format(Number(listing.price));
}
