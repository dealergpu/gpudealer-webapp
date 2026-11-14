import type { MetadataRoute } from "next";
import { getAllPublishedListings, SITE_URL } from "@/lib/site";
import { listingPath } from "@/lib/listing-path";
import { CITY_PAGES } from "@/lib/cities";
import { getComputeProviders, type ComputeProvider } from "@/lib/api";
import { GPU_PAGES, hasGpuPricing } from "@/lib/compute";

// Rebuilt per request: there's no ISR cache on Cloudflare (see app/page.tsx),
// so a cached sitemap would stay frozen at build-time inventory.
export const dynamic = "force-dynamic";

const CATEGORY_PAGES = ["GPU", "SERVER", "MEMORY"];

// Active compute providers with at least one offering (others are noindex).
async function getListedComputeProviders(): Promise<ComputeProvider[]> {
  const providers: ComputeProvider[] = [];
  for (let page = 1; page <= 20; page++) {
    try {
      const res = await getComputeProviders({ limit: 100, page });
      providers.push(...res.data);
      if (page >= res.pagination.totalPages) break;
    } catch {
      break;
    }
  }
  return providers.filter((provider) => provider.offeringCount > 0);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [listings, computeProviders, gpuPagesWithPrices] = await Promise.all([
    getAllPublishedListings(),
    getListedComputeProviders(),
    Promise.all(GPU_PAGES.map(async (gpu) => ((await hasGpuPricing(gpu.slug)) ? gpu : null))),
  ]);

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
    ...["/compute", "/compute/gpu-cloud", "/compute/inference"].map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...gpuPagesWithPrices.flatMap((gpu) =>
      gpu ? [{ url: `${SITE_URL}/compute/gpu-cloud/${gpu.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 }] : [],
    ),
    ...computeProviders.map((provider) => ({
      url: `${SITE_URL}/compute/providers/${provider.slug}`,
      lastModified: new Date(provider.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/compute/request`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/return-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
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
