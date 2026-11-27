import type { MetadataRoute } from "next";
import { getAllPublishedListings, SITE_URL } from "@/lib/site";
import { listingPath } from "@/lib/listing-path";
import { CITY_PAGES } from "@/lib/cities";
import { GPU_PAGES, getAllComputeProviders, hasGpuPricing, isProviderIndexable } from "@/lib/compute";
import { HTML_LANG, LOCALES, localizePath } from "@/i18n/config";

// Rebuilt per request: there's no ISR cache on Cloudflare (see app/page.tsx),
// so a cached sitemap would stay frozen at build-time inventory.
export const dynamic = "force-dynamic";

const CATEGORY_PAGES = ["GPU", "SERVER", "MEMORY"];

// Every URL is listed once per language, each carrying hreflang links to all
// versions — so the cap leaves room under the 50k-URLs-per-sitemap limit.
const MAX_LISTINGS = 24_000;

const absolute = (href: string) => (href === "/" ? SITE_URL : `${SITE_URL}${href}`);

/** One sitemap entry per locale for an unprefixed path, cross-linked with hreflang. */
function inAllLocales(entry: Omit<MetadataRoute.Sitemap[number], "url"> & { path: string }): MetadataRoute.Sitemap {
  const { path, ...rest } = entry;
  const languages = Object.fromEntries(LOCALES.map((locale) => [HTML_LANG[locale], absolute(localizePath(path, locale))]));
  return LOCALES.map((locale) => ({
    ...rest,
    url: absolute(localizePath(path, locale)),
    alternates: { languages: { ...languages, "x-default": absolute(path) } },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [listings, computeProviders, gpuPagesWithPrices] = await Promise.all([
    getAllPublishedListings(),
    getAllComputeProviders(),
    Promise.all(GPU_PAGES.map(async (gpu) => ((await hasGpuPricing(gpu.slug)) ? gpu : null))),
  ]);

  const pages = [
    { path: "/", lastModified: now, changeFrequency: "daily" as const, priority: 1 },
    { path: "/gpus", lastModified: now, changeFrequency: "hourly" as const, priority: 0.9 },
    ...CATEGORY_PAGES.map((category) => ({
      path: `/gpus?category=${category}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { path: "/gpus-by-city", lastModified: now, changeFrequency: "daily" as const, priority: 0.8 },
    ...CITY_PAGES.map((city) => ({
      path: `/${city.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...["/compute", "/compute/gpu-cloud", "/compute/inference", "/compute/providers"].map((path) => ({
      path,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...gpuPagesWithPrices.flatMap((gpu) =>
      gpu ? [{ path: `/compute/gpu-cloud/${gpu.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 }] : [],
    ),
    // Same rule as the provider page's robots meta. /compute/compare is
    // user-built (`?ids=`) and noindex, so it's never listed.
    ...computeProviders.filter(isProviderIndexable).map((provider) => ({
      path: `/compute/providers/${provider.slug}`,
      lastModified: new Date(provider.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { path: "/compute/request", lastModified: now, changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/return-policy", lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
    ...listings.slice(0, MAX_LISTINGS).map((listing) => {
      const images = [...(listing.images ?? [])]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((image) => image.url);
      return {
        path: listingPath(listing),
        lastModified: new Date(listing.updatedAt ?? listing.createdAt),
        changeFrequency: "daily" as const,
        priority: 0.7,
        ...(images.length ? { images } : {}),
      };
    }),
  ];

  return pages.flatMap(inAllLocales);
}
