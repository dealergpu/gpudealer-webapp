import { getAllPublishedListings, SITE_URL } from "@/lib/site";
import type { Listing } from "@/lib/api";
import { listingPath } from "@/lib/listing-path";
import { formatListingPrice, hasListingPrice } from "@/lib/listing-price";

// llms.txt (https://llmstxt.org): a plain-Markdown map of the site for LLM
// crawlers and assistants. Rendered per request so inventory stays current.
export const dynamic = "force-dynamic";

function describe(listing: Listing): string {
  const price = formatListingPrice(listing, 0);
  const location = [listing.locationCity, listing.locationRegion, listing.locationCountry].filter(Boolean).join(", ");
  const details = [
    listing.vramGb != null ? `${listing.vramGb}GB VRAM` : null,
    listing.condition?.toLowerCase(),
    `${price}${listing.quantity && listing.quantity > 1 ? `${hasListingPrice(listing) ? " each" : ""}, ${listing.quantity} available` : ""}`,
    location || null,
  ].filter(Boolean);
  return `- [${listing.title}](${SITE_URL}${listingPath(listing)}): ${details.join(" · ")}`;
}

export async function GET() {
  const listings = await getAllPublishedListings();

  const body = `# GPUDealer

> GPUDealer is a marketplace and discovery platform for used GPUs, AI servers, memory and other AI compute hardware. Buyers can search inventory, sellers can list hardware, and anyone can request hardware they can't find.

GPUDealer is not a GPU cloud or rental service — it lists physical hardware for sale. Listings are either submitted by registered sellers on GPUDealer or aggregated from third-party marketplaces (which link back to the original listing). Each listing states its source; nothing is described as verified unless GPUDealer has verified it.

## Main pages

- [Home](${SITE_URL}/): overview, latest listings, browse by VRAM
- [Find hardware](${SITE_URL}/gpus): searchable inventory, filterable via URL parameters — \`q\` (text), \`category\` (GPU | SERVER | MEMORY | OTHER), \`condition\` (NEW | USED | REFURBISHED), \`minVramGb\`, \`maxPrice\`, \`sortBy\` (newest | price_asc | price_desc | relevance). Example: ${SITE_URL}/gpus?q=RTX%204090&minVramGb=24&maxPrice=1300
- [GPUs](${SITE_URL}/gpus?category=GPU)
- [GPU servers](${SITE_URL}/gpus?category=SERVER)
- [Memory](${SITE_URL}/gpus?category=MEMORY)
- [Sell hardware](${SITE_URL}/sell): list GPUs or AI hardware (account required)
- [Request hardware](${SITE_URL}/request): tell GPUDealer what you need — model, quantity, budget, destination (account required)

## Listings (${listings.length})

${listings.length ? listings.map(describe).join("\n") : "No published listings right now."}

## Optional

- [Sitemap](${SITE_URL}/sitemap.xml)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
