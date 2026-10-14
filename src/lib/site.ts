import { getListings, ListingStatus, type Listing } from "@/lib/api";

/** Canonical origin used for sitemap, robots, canonical URLs and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://gpudealer.com").replace(/\/$/, "");

export const SITE_NAME = "GPUDealer";
export const SITE_DESCRIPTION =
  "GPUDealer — used GPUs, AI servers, memory and compute hardware. Find. Sell. Request.";

const PAGE_SIZE = 100; // API maximum
const MAX_PAGES = 400; // 40k URLs — safely under the 50k-per-sitemap limit

/**
 * Every published listing, paged through the public API. Used by the sitemap
 * and llms.txt; returns whatever it managed to fetch if a page fails.
 */
export async function getAllPublishedListings(): Promise<Listing[]> {
  const listings: Listing[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const res = await getListings({ status: ListingStatus.PUBLISHED, limit: PAGE_SIZE, page });
      listings.push(...res.data);
      if (page >= res.pagination.totalPages) break;
    } catch {
      break;
    }
  }
  return listings;
}
