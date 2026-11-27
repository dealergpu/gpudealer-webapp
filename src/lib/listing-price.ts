import type { Listing } from "@/lib/api";

/** English fallback; pages pass the translated `t.listing.priceOnRequest`. */
export const PRICE_ON_REQUEST = "Price on request";

/** True when the listing has a usable asking price (`price` is a decimal string, or null). */
export function hasListingPrice(listing: Pick<Listing, "price">): boolean {
  return listing.price != null && listing.price !== "" && Number.isFinite(Number(listing.price));
}

/**
 * Formats `price` in the listing's own currency (never converted), or
 * `onRequest` ("Price on request") when there is none.
 */
export function formatListingPrice(
  listing: Pick<Listing, "price" | "currency">,
  maximumFractionDigits?: number,
  onRequest: string = PRICE_ON_REQUEST,
): string {
  if (!hasListingPrice(listing)) return onRequest;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: listing.currency || "USD",
    maximumFractionDigits,
  }).format(Number(listing.price));
}
