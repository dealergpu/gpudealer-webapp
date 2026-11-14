import {
  ComputeBillingMode,
  ComputeOfferingType,
  ComputePricingConfidence,
  ComputePricingUnit,
  ComputeProviderType,
  ComputeWorkloadType,
  getComputePricing,
  getVisitComputeProviderUrl,
  type ComputePrice,
} from "@/lib/api";

// Display rules for the compute comparison pages. Prices are decimal strings
// from the API; they're only turned into numbers for display formatting.
// Any arithmetic (calculators) goes through the fixed-point helpers below.

export const UNIT_LABELS: Record<ComputePricingUnit, string> = {
  [ComputePricingUnit.GPU_HOUR]: "/ GPU / hr",
  [ComputePricingUnit.INSTANCE_HOUR]: "/ instance / hr",
  [ComputePricingUnit.SECOND]: "/ sec",
  [ComputePricingUnit.INPUT_MILLION_TOKENS]: "/ 1M input tokens",
  [ComputePricingUnit.OUTPUT_MILLION_TOKENS]: "/ 1M output tokens",
  [ComputePricingUnit.REQUEST]: "/ request",
  [ComputePricingUnit.FIXED_MONTHLY]: "/ month",
  [ComputePricingUnit.CUSTOM_QUOTE]: "",
};

// Group headings on the compare page ("Per GPU-hour · On-demand").
export const UNIT_TITLES: Record<ComputePricingUnit, string> = {
  [ComputePricingUnit.GPU_HOUR]: "Per GPU-hour",
  [ComputePricingUnit.INSTANCE_HOUR]: "Per instance-hour",
  [ComputePricingUnit.SECOND]: "Per second",
  [ComputePricingUnit.INPUT_MILLION_TOKENS]: "Input, per 1M tokens",
  [ComputePricingUnit.OUTPUT_MILLION_TOKENS]: "Output, per 1M tokens",
  [ComputePricingUnit.REQUEST]: "Per request",
  [ComputePricingUnit.FIXED_MONTHLY]: "Per month",
  [ComputePricingUnit.CUSTOM_QUOTE]: "Custom quote",
};

export const CONFIDENCE_LABELS: Record<ComputePricingConfidence, string> = {
  [ComputePricingConfidence.LIVE]: "Live",
  [ComputePricingConfidence.VERIFIED]: "Verified",
  [ComputePricingConfidence.ESTIMATED]: "Estimate",
  [ComputePricingConfidence.QUOTE_REQUIRED]: "Quote required",
  [ComputePricingConfidence.UNKNOWN]: "Unverified",
};

export const BILLING_MODE_LABELS: Record<ComputeBillingMode, string> = {
  [ComputeBillingMode.ON_DEMAND]: "On-demand",
  [ComputeBillingMode.SPOT]: "Spot",
  [ComputeBillingMode.RESERVED]: "Reserved",
  [ComputeBillingMode.SERVERLESS]: "Serverless",
};

export const PROVIDER_TYPE_LABELS: Record<ComputeProviderType, string> = {
  [ComputeProviderType.GPU_CLOUD]: "GPU cloud",
  [ComputeProviderType.INFERENCE_API]: "Inference API",
  [ComputeProviderType.SERVERLESS_COMPUTE]: "Serverless",
  [ComputeProviderType.DEDICATED_INFERENCE]: "Dedicated inference",
  [ComputeProviderType.NEO_CLOUD]: "Neocloud",
  [ComputeProviderType.MULTI_SERVICE]: "Multi-service",
};

export const OFFERING_TYPE_LABELS: Record<ComputeOfferingType, string> = {
  [ComputeOfferingType.GPU_INSTANCE]: "GPU instance",
  [ComputeOfferingType.GPU_SERVERLESS]: "Serverless GPU",
  [ComputeOfferingType.MODEL_INFERENCE]: "Model inference",
  [ComputeOfferingType.DEDICATED_INFERENCE]: "Dedicated inference",
  [ComputeOfferingType.RESERVED_CAPACITY]: "Reserved capacity",
};

export const WORKLOAD_LABELS: Record<ComputeWorkloadType, string> = {
  [ComputeWorkloadType.TRAINING]: "Training",
  [ComputeWorkloadType.FINE_TUNING]: "Fine-tuning",
  [ComputeWorkloadType.INFERENCE]: "Inference",
  [ComputeWorkloadType.BATCH_PROCESSING]: "Batch processing",
  [ComputeWorkloadType.RENDERING]: "Rendering",
  [ComputeWorkloadType.OTHER]: "Other",
};

/**
 * GPU models that get their own `/compute/gpu-cloud/{slug}` page. A fixed
 * list rather than one page per model string, so we don't publish thin
 * pages; the slug is passed to the API's normalized `gpuModel` match.
 */
export const GPU_PAGES = [
  { slug: "h100", label: "H100" },
  { slug: "h200", label: "H200" },
  { slug: "b200", label: "B200" },
  { slug: "a100", label: "A100" },
  { slug: "l40s", label: "L40S" },
  { slug: "rtx-4090", label: "RTX 4090" },
  { slug: "rtx-5090", label: "RTX 5090" },
  { slug: "rtx-a6000", label: "RTX A6000" },
  { slug: "mi300x", label: "MI300X" },
] as const;

export type GpuPage = (typeof GPU_PAGES)[number];

export function findGpuPage(slug: string): GpuPage | undefined {
  return GPU_PAGES.find((gpu) => gpu.slug === slug.toLowerCase());
}

/** Decimal places shown for a price: at least 2, more for sub-cent token prices. */
function fractionDigits(amount: string): number {
  const decimals = amount.split(".")[1]?.length ?? 0;
  return Math.min(Math.max(decimals, 2), 6);
}

export function formatMoney(amount: string, currency: string): string {
  try {
    const digits = fractionDigits(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number(amount));
  } catch {
    // Unknown currency code.
    return `${amount} ${currency}`;
  }
}

/** "$2.49" — or "Contact for pricing" for quote-only prices. Never "$0". */
export function formatPriceAmount(price: Pick<ComputePrice, "amount" | "currency">): string {
  return price.amount == null ? "Contact for pricing" : formatMoney(price.amount, price.currency);
}

/** "Nov 10, 2026" — dates are UTC so server and browser agree. */
export function formatCheckedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function formatContextLength(tokens: number): string {
  if (tokens >= 1_000_000 && tokens % 1_000_000 === 0) return `${tokens / 1_000_000}M`;
  if (tokens >= 1024 && tokens % 1024 === 0) return `${tokens / 1024}K`;
  return tokens.toLocaleString("en-US");
}

/**
 * The price to headline for one unit of an offering: on-demand over other
 * billing modes, all-regions over a specific region, fresh over stale.
 * Returns undefined when the offering has no price in that unit.
 */
export function pickPrice(pricing: ComputePrice[], unit: ComputePricingUnit): ComputePrice | undefined {
  const score = (price: ComputePrice) =>
    (price.billingMode === ComputeBillingMode.ON_DEMAND ? 0 : 4) + (price.region == null ? 0 : 2) + (price.isStale ? 1 : 0);
  return pricing.filter((price) => price.unit === unit).sort((a, b) => score(a) - score(b))[0];
}

/**
 * Outbound "Visit provider" link. Always goes through the API's redirect so
 * the click is recorded and the server picks the destination — never link
 * to a provider's website directly. Use as a plain `<a href>`; never fetch
 * or prefetch it.
 */
export function providerVisitUrl(providerSlug: string, options: { offering?: string; source: string }): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  return `${base}${getVisitComputeProviderUrl(providerSlug, options)}`;
}

// ---------------------------------------------------------------------------
// Fixed-point maths for the cost calculators. Amounts are scaled by 10^8 (the
// API's max precision) and kept as bigint, so no float rounding creeps in.
// ---------------------------------------------------------------------------

const SCALE_DIGITS = 8;
const SCALE = BigInt(10 ** SCALE_DIGITS);

/** "2.49" → 249000000n. Null for anything that isn't a plain non-negative decimal. */
export function toFixedPoint(value: string): bigint | null {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return null;
  const fraction = (match[2] ?? "").slice(0, SCALE_DIGITS).padEnd(SCALE_DIGITS, "0");
  return BigInt(match[1]) * SCALE + BigInt(fraction);
}

/** Multiplies a fixed-point amount by another fixed-point amount. */
export function multiplyFixed(a: bigint, b: bigint): bigint {
  return (a * b) / SCALE;
}

/** Formats a fixed-point amount as money, rounded to cents. */
export function formatFixedMoney(value: bigint, currency: string): string {
  const cents = (value + SCALE / 200n) / (SCALE / 100n);
  return formatMoney(`${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`, currency);
}

/**
 * Whether a GPU page has any current price to show. Pages without one are
 * noindexed and left out of the sitemap, so we never publish thin pages.
 */
export async function hasGpuPricing(gpuSlug: string): Promise<boolean> {
  try {
    const result = await getComputePricing({ gpuModel: gpuSlug, limit: 1 });
    return result.pagination.total > 0;
  } catch {
    return false;
  }
}
