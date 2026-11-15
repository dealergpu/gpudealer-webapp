import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { ProviderLogo } from "@/components/compute/ProviderLogo";
import { PricingStatus } from "@/components/compute/PricingStatus";
import {
  ComputeBillingMode,
  ComputePricingUnit,
  GetComputePricingSortBy,
  getComputePricing,
  getComputeProviders,
  type ComputePriceRow,
  type ComputeProvider,
} from "@/lib/api";
import { GPU_PAGES, UNIT_LABELS, formatPriceAmount } from "@/lib/compute";

// GPUs headlined on the home page; each links to its /compute/gpu-cloud page.
const HOME_GPUS = GPU_PAGES.filter((gpu) => ["h100", "h200", "a100", "rtx-4090"].includes(gpu.slug));
const PROVIDER_STRIP_LIMIT = 12;

// Cheapest current on-demand per-GPU-hour price. One unit and billing mode
// only, so the "from" price is a like-for-like comparison.
async function cheapestGpuHour(gpuModel: string): Promise<ComputePriceRow | null> {
  try {
    const result = await getComputePricing({
      gpuModel,
      unit: ComputePricingUnit.GPU_HOUR,
      billingMode: ComputeBillingMode.ON_DEMAND,
      sortBy: GetComputePricingSortBy.price_asc,
      limit: 1,
    });
    const row = result.data[0];
    return row?.amount != null ? row : null;
  } catch {
    return null;
  }
}

async function loadProviders(): Promise<{ providers: ComputeProvider[]; total: number } | null> {
  try {
    const result = await getComputeProviders({ limit: 100 });
    // Providers with prices first, then featured, keeping the API's A–Z order otherwise.
    const rank = (p: ComputeProvider) => (p.offeringCount > 0 ? 0 : 2) + (p.isFeatured ? 0 : 1);
    const providers = [...result.data].sort((a, b) => rank(a) - rank(b));
    return { providers, total: result.pagination.total };
  } catch {
    return null;
  }
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{children}</p>;
}

const TILE = "flex h-full min-h-[180px] flex-col rounded-3xl border border-border bg-card p-6";

function ComputeDataSkeleton() {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {HOME_GPUS.map((gpu) => (
        <div key={gpu.slug} className={`${TILE} animate-pulse`}>
          <div className="h-6 w-20 rounded bg-muted" />
          <div className="mt-auto h-8 w-28 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

async function ComputeData() {
  const [prices, directory] = await Promise.all([
    Promise.all(HOME_GPUS.map((gpu) => cheapestGpuHour(gpu.slug))),
    loadProviders(),
  ]);

  return (
    <>
      <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {HOME_GPUS.map((gpu, i) => {
          const row = prices[i];
          return (
            <RevealItem key={gpu.slug}>
              <Link href={`/compute/gpu-cloud/${gpu.slug}`} className={`group card-hover ${TILE} hover:border-foreground/25`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-3xl leading-none">{gpu.label}</h3>
                  <ArrowUpRight
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </div>
                {row ? (
                  <div className="mt-auto pt-6">
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="font-mono text-2xl font-semibold tracking-tight">
                      {formatPriceAmount(row)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">{UNIT_LABELS[row.unit]}</span>
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      On-demand · {row.offering.provider.name}
                    </p>
                    <PricingStatus price={row} className="mt-3" />
                  </div>
                ) : (
                  <p className="mt-auto pt-6 text-sm text-muted-foreground">Compare cloud providers</p>
                )}
              </Link>
            </RevealItem>
          );
        })}
      </RevealGroup>

      {directory && directory.providers.length > 0 && (
        <Reveal className="mt-10">
          <h3 className="text-sm font-semibold">Providers we track</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {directory.providers.slice(0, PROVIDER_STRIP_LIMIT).map((provider) => (
              <li key={provider.id}>
                <Link
                  href={`/compute/providers/${provider.slug}`}
                  className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3.5 text-sm transition-colors hover:border-foreground/30"
                >
                  <ProviderLogo provider={provider} className="h-7 w-7 rounded-full" />
                  {provider.name}
                </Link>
              </li>
            ))}
            {directory.total > PROVIDER_STRIP_LIMIT && (
              <li>
                <Link
                  href="/compute#providers"
                  className="flex h-full items-center gap-1.5 rounded-full px-3.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  All {directory.total} providers
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            )}
          </ul>
        </Reveal>
      )}
    </>
  );
}

/**
 * Home page entry point to the compute comparison: cheapest on-demand
 * GPU-hour prices for a few headline GPUs, plus the provider directory.
 * The heading and CTAs render immediately; the API data streams in, and
 * each part hides or falls back on its own if the API fails.
 */
export function ComputeHighlights() {
  return (
    <section aria-labelledby="compute-heading" className="border-t border-border bg-background py-24 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-6 md:grid-cols-2 md:items-end">
          <Reveal>
            <SectionEyebrow>Compute prices</SectionEyebrow>
            <h2 id="compute-heading" className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-6xl">
              Need compute, not hardware? <em className="text-accent">Compare it.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="md:justify-self-end">
            <p className="max-w-md text-muted-foreground">
              Hourly GPU cloud prices and per-token inference prices, each with its source and the date it was
              checked. We compare and link you to the provider — we don&apos;t resell compute.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="accent">
                <Link href="/compute/gpu-cloud">
                  Compare GPU cloud prices
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/compute/inference">Inference API prices</Link>
              </Button>
            </div>
          </Reveal>
        </div>

        <Suspense fallback={<ComputeDataSkeleton />}>
          <ComputeData />
        </Suspense>
      </div>
    </section>
  );
}
