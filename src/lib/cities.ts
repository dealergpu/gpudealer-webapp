import type { Messages } from "@/i18n/messages";

/**
 * City landing pages (/buy-gpu-in-<city>) — static SEO pages whose listings
 * load live from the API. Each city carries its own copy so the pages aren't
 * thin duplicates of one another. The copy (name, intro, sections, FAQs)
 * lives in the locale files under `cities.<slug>`; this file only holds the
 * data that doesn't change with language.
 */

export type CityLandmark = "cn-tower" | "calgary-tower" | "olympic-stadium" | "tower-bridge" | "willis-tower" | "statue-of-liberty";

type CitySlug = keyof Messages["cities"];

export type CityConfig = {
  /** URL slug: the page lives at `/${slug}`. Also the key of its copy in the locale files. */
  slug: CitySlug;
  /**
   * Exact value for the API's `city` filter. Matching is case-insensitive but
   * accent-sensitive, so it must be spelled the way listings store it
   * (Montréal, not Montreal).
   */
  apiCity: string;
  /** ISO 3166-1 alpha-2, sent as the API's `country` filter. */
  country: "CA" | "US" | "GB";
  landmark: CityLandmark;
};

export type CityPage = CityConfig & Messages["cities"][CitySlug];

export const CITY_PAGES: CityConfig[] = [
  { slug: "buy-gpu-in-toronto", apiCity: "Toronto", country: "CA", landmark: "cn-tower" },
  { slug: "buy-gpu-in-calgary", apiCity: "Calgary", country: "CA", landmark: "calgary-tower" },
  { slug: "buy-gpu-in-montreal", apiCity: "Montréal", country: "CA", landmark: "olympic-stadium" },
  { slug: "buy-gpu-in-london", apiCity: "London", country: "GB", landmark: "tower-bridge" },
  { slug: "buy-gpu-in-chicago", apiCity: "Chicago", country: "US", landmark: "willis-tower" },
  { slug: "buy-gpu-in-new-york", apiCity: "New York", country: "US", landmark: "statue-of-liberty" },
];

/** A city's config merged with its copy in the current language. */
export function localizeCity(city: CityConfig, t: Messages): CityPage {
  return { ...city, ...t.cities[city.slug] };
}

export function getCityPage(slug: string, t: Messages): CityPage | undefined {
  const city = CITY_PAGES.find((c) => c.slug === slug);
  return city && localizeCity(city, t);
}
