import type { MetadataRoute } from "next";
import { getAllPublishedListings, SITE_URL } from "@/lib/site";
import { listingPath } from "@/lib/listing-path";
import { CITY_PAGES } from "@/lib/cities";

// Rebuilt per request: there's no ISR cache on Cloudflare (see app/page.tsx),
// so a cached sitemap would stay frozen at build-time inventory.
export const dynamic = "force-dynamic";

const CATEGORY_PAGES = ["GPU", "SERVER", "MEMORY"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const listings = await getAllPublishedListings();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/gpus`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    ...CATEGORY_PAGES.map((category) => ({
      url: `${SITE_URL}/gpus?category=${category}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/gpus-by-city`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...CITY_PAGES.map((city) => ({
      url: `${SITE_URL}/${city.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => {
    const images = [...(listing.images ?? [])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((image) => image.url);
    return {
      url: `${SITE_URL}${listingPath(listing)}`,
      lastModified: new Date(listing.updatedAt ?? listing.createdAt),
      changeFrequency: "daily",
      priority: 0.7,
      ...(images.length ? { images } : {}),
    };
  });

  return [...staticPages, ...listingPages];
}
