import { getAllPublishedListings } from "@/lib/site";
import { CITY_PAGES } from "@/lib/cities";

export type ListingLocation = {
  /** Spelled exactly as listings store it (accents included), so it works as a `city` filter. */
  city: string;
  region: string | null;
  /** ISO 3166-1 alpha-2. */
  country: string;
  count: number;
};

/**
 * Every city with published listings, with its count, most listings first.
 *
 * TEMPORARY: aggregated from the full published-listings crawl (the same one
 * the sitemap uses) because the API has no locations endpoint yet. Replace
 * the body with a call to `GET /listings/locations` once the backend ships it;
 * the return shape is meant to match that endpoint's.
 */
export async function getListingLocations(): Promise<ListingLocation[]> {
  const listings = await getAllPublishedListings();
  const byKey = new Map<string, ListingLocation>();

  for (const listing of listings) {
    const city = listing.locationCity?.trim();
    const country = listing.locationCountry?.trim().toUpperCase();
    if (!city || !country) continue;
    const region = listing.locationRegion?.trim() || null;

    const key = [city.toLowerCase(), region?.toLowerCase(), country].join("|");
    const existing = byKey.get(key);
    if (existing) existing.count++;
    else byKey.set(key, { city, region, country, count: 1 });
  }

  return [...byKey.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}

/** Where a city links: its dedicated landing page if one exists, otherwise filtered search. */
export function locationHref(location: Pick<ListingLocation, "city" | "country">): string {
  const page = CITY_PAGES.find(
    (c) => c.apiCity.toLowerCase() === location.city.toLowerCase() && c.country === location.country,
  );
  if (page) return `/${page.slug}`;
  const params = new URLSearchParams({ city: location.city, country: location.country });
  return `/gpus?${params}`;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}
