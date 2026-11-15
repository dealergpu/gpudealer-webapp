import { getAllPublishedListings, SITE_URL } from "@/lib/site";
import type { Listing } from "@/lib/api";
import { listingPath } from "@/lib/listing-path";
import { formatListingPrice, hasListingPrice } from "@/lib/listing-price";
import type { ComputeProvider } from "@/lib/api";
import {
  GPU_PAGES,
  PROVIDER_TYPE_LABELS,
  UNIT_LABELS,
  cheapestOnDemandGpuHour,
  formatCheckedDate,
  formatPriceAmount,
  getAllComputeProviders,
  isProviderIndexable,
} from "@/lib/compute";

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

function describeProvider(provider: ComputeProvider): string {
  const details = [
    provider.providerTypes.map((t) => PROVIDER_TYPE_LABELS[t]).join(", "),
    provider.description,
    provider.offeringCount > 0
      ? `${provider.offeringCount} ${provider.offeringCount === 1 ? "offering" : "offerings"} with prices`
      : "prices not recorded yet",
  ].filter(Boolean);
  return `- [${provider.name}](${SITE_URL}/compute/providers/${provider.slug}): ${details.join(" · ")}`;
}

// Only GPU pages that have prices are listed (the rest are noindex).
async function describeGpuPages(): Promise<string[]> {
  const cheapest = await Promise.all(GPU_PAGES.map((gpu) => cheapestOnDemandGpuHour(gpu.slug)));
  return GPU_PAGES.flatMap((gpu, i) => {
    const row = cheapest[i];
    if (!row) return [];
    const from = `from ${formatPriceAmount(row)} ${UNIT_LABELS[row.unit]} on-demand at ${row.offering.provider.name} (checked ${formatCheckedDate(row.lastVerifiedAt)})`;
    return [`- [${gpu.label} cloud pricing](${SITE_URL}/compute/gpu-cloud/${gpu.slug}): ${from}`];
  });
}

export async function GET() {
  const [listings, providers, gpuPages] = await Promise.all([
    getAllPublishedListings(),
    getAllComputeProviders(),
    describeGpuPages(),
  ]);
  const listedProviders = providers.filter(isProviderIndexable);

  const body = `# GPUDealer

> GPUDealer is a marketplace and discovery platform for used GPUs, AI servers, memory and other AI compute hardware. Buyers can search inventory, sellers can list hardware, and anyone can request hardware they can't find.

GPUDealer is not a GPU cloud or rental service — it lists physical hardware for sale, and separately compares third-party GPU cloud and AI inference providers (it doesn't resell compute; it shows their published prices and links out). Listings are either submitted by registered sellers on GPUDealer or aggregated from third-party marketplaces (which link back to the original listing). Each listing states its source; nothing is described as verified unless GPUDealer has verified it.

## Main pages

- [Home](${SITE_URL}/): overview, latest listings, browse by VRAM
- [Find hardware](${SITE_URL}/gpus): searchable inventory, filterable via URL parameters — \`q\` (text), \`category\` (GPU | SERVER | MEMORY | OTHER), \`condition\` (NEW | USED | REFURBISHED), \`minVramGb\`, \`maxPrice\`, \`sortBy\` (newest | price_asc | price_desc | relevance). Example: ${SITE_URL}/gpus?q=RTX%204090&minVramGb=24&maxPrice=1300
- [GPUs](${SITE_URL}/gpus?category=GPU)
- [GPU servers](${SITE_URL}/gpus?category=SERVER)
- [Memory](${SITE_URL}/gpus?category=MEMORY)
- [Sell hardware](${SITE_URL}/sell): list GPUs or AI hardware (account required)
- [Request hardware](${SITE_URL}/request): tell GPUDealer what you need — model, quantity, budget, destination (account required)

## Compute comparison

Compares GPU cloud and AI inference providers. Prices come from each provider's own pricing pages or APIs; every price shows a confidence level (Live, Verified, Estimate) and the date it was last checked, and older prices are marked as possibly outdated. Prices in different units (per GPU-hour vs per instance-hour, input vs output tokens) are never ranked against each other. Quote-only offerings show "Contact for pricing".

- [Compute overview](${SITE_URL}/compute): GPU cloud vs inference APIs vs dedicated inference, plus the provider directory. Filter with \`type\` (${Object.keys(PROVIDER_TYPE_LABELS).join(" | ")}).
- [GPU cloud prices](${SITE_URL}/compute/gpu-cloud): hourly GPU rental prices. URL parameters — \`gpu\` (model, e.g. H100), \`unit\` (\`instance\` for per-instance-hour; per-GPU-hour by default), \`billing\` (ON_DEMAND | SPOT | RESERVED | SERVERLESS | ANY), \`region\`, \`sort\` (price_asc | price_desc | newest). Example: ${SITE_URL}/compute/gpu-cloud?gpu=H100&billing=ANY
- [Inference API prices](${SITE_URL}/compute/inference): per-token prices for hosted models, input and output listed separately, with context length and API features. URL parameters — \`model\`, \`provider\` (provider slug), \`region\`, \`openai\` (true | false).
- [Compare offerings](${SITE_URL}/compute/compare): side-by-side comparison of up to 10 offerings, \`?ids=\` with comma-separated offering ids.
- [Tell us what compute you need](${SITE_URL}/compute/request): workload, GPUs or models, volume and budget (no account needed).
${gpuPages.length ? `\n### GPU cloud pricing by model\n\n${gpuPages.join("\n")}\n` : ""}
### Providers (${listedProviders.length})

${listedProviders.length ? listedProviders.map(describeProvider).join("\n") : "No providers listed right now."}

## Listings (${listings.length})

${listings.length ? listings.map(describe).join("\n") : "No published listings right now."}

## Optional

- [Sitemap](${SITE_URL}/sitemap.xml)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
