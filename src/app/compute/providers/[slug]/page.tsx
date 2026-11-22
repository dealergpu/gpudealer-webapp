import Link from "next/link";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  getComputeOfferings,
  getComputeProvider,
  type ComputeOffering,
  type ComputePrice,
  type ComputeProvider,
} from "@/lib/api";
import {
  OFFERING_TYPE_LABELS,
  PROVIDER_TYPE_LABELS,
  UNIT_LABELS,
  formatContextLength,
  formatPriceAmount,
  isProviderIndexable,
  providerLogoSrc,
} from "@/lib/compute";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { PricingStatus, PriceTags } from "@/components/compute/PricingStatus";
import { ProviderCTA } from "@/components/compute/ProviderCTA";
import { FeaturedBadge } from "@/components/compute/FeaturedBadge";
import { ProviderLogo } from "@/components/compute/ProviderLogo";
import { CompareToggle } from "@/components/compute/CompareSelection";
import { Capabilities } from "@/components/compute/Capabilities";
import { AffiliateDisclosure } from "@/components/compute/AffiliateDisclosure";
import { ComputeError } from "@/components/compute/ComputeStates";

type Params = Promise<{ slug: string }>;

// Shared by generateMetadata and the page within one request.
const loadProvider = cache(async (slug: string): Promise<ComputeProvider | null> => {
  try {
    return (await getComputeProvider(slug)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

// One page of 100 covers every provider today; a provider with more shows a note.
async function loadOfferings(slug: string) {
  try {
    return await getComputeOfferings({ provider: slug, limit: 100 });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const provider = await loadProvider(slug).catch(() => null);
  if (!provider) return { title: "Provider not found", robots: { index: false } };

  const services = provider.providerTypes.map((t) => PROVIDER_TYPE_LABELS[t]).join(", ");
  return {
    title: `${provider.name} Pricing — ${services}`,
    description:
      provider.description ??
      `${provider.name} GPU cloud and inference prices on GPUDealer, with when each price was last checked.`,
    alternates: { canonical: `${SITE_URL}/compute/providers/${provider.slug}` },
    // Thin otherwise; same rule as the sitemap and llms.txt.
    ...(isProviderIndexable(provider) ? {} : { robots: { index: false, follow: true } }),
  };
}

/**
 * Breadcrumbs plus the provider as an Organization, with each public price
 * as an Offer (quote-only prices have no number, so they're left out).
 */
function providerJsonLd(provider: ComputeProvider, offerings: ComputeOffering[]) {
  const logo = providerLogoSrc(provider, "full");
  const offers = offerings.flatMap((offering) =>
    offering.pricing.flatMap((price) =>
      price.amount == null
        ? []
        : [
            {
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: offering.name, category: OFFERING_TYPE_LABELS[offering.offeringType] },
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: price.amount,
                priceCurrency: price.currency,
                unitText: UNIT_LABELS[price.unit].replace(/^\/ /, "per "),
              },
            },
          ],
    ),
  );
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        ["Compute", "/compute"],
        [provider.name, `/compute/providers/${provider.slug}`],
      ]),
      {
        "@type": "Organization",
        name: provider.name,
        url: provider.websiteUrl,
        ...(provider.description ? { description: provider.description } : {}),
        ...(logo ? { logo: logo.startsWith("/") ? `${SITE_URL}${logo}` : logo } : {}),
        ...(offers.length ? { makesOffer: offers.slice(0, 100) } : {}),
      },
    ],
  };
}

function PriceLine({ price }: { price: ComputePrice }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 py-2.5">
      <div>
        <p className="whitespace-nowrap">
          <span className="font-mono font-semibold tabular-nums">{formatPriceAmount(price)}</span>{" "}
          <span className="text-xs text-muted-foreground">{UNIT_LABELS[price.unit]}</span>
        </p>
        <PriceTags price={price} className="mt-1" />
        {price.notes && <p className="mt-1 max-w-md text-xs text-muted-foreground">{price.notes}</p>}
      </div>
      <div className="flex items-start gap-3">
        <PricingStatus price={price} />
        {price.sourceUrl && (
          <a href={price.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            Source
          </a>
        )}
      </div>
    </li>
  );
}

function specLine(o: ComputeOffering): string {
  return [
    o.gpuCount && o.gpuModel ? `${o.gpuCount}× ${o.gpuModel}` : o.gpuModel,
    o.gpuVramGb ? `${o.gpuVramGb}GB VRAM` : null,
    o.cpuDescription,
    o.ramGb ? `${o.ramGb}GB RAM` : null,
    o.storageDescription,
    o.modelProvider ? `by ${o.modelProvider}` : null,
    o.contextLength ? `${formatContextLength(o.contextLength)} context` : null,
    o.regions.length ? o.regions.join(", ") : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function OfferingCard({ offering, provider }: { offering: ComputeOffering; provider: ComputeProvider }) {
  return (
    <li className="rounded-3xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{OFFERING_TYPE_LABELS[offering.offeringType]}</p>
          <h3 className="mt-1 text-base font-semibold">{offering.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{specLine(offering)}</p>
          {offering.description && <p className="mt-2 max-w-2xl text-sm">{offering.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <CompareToggle item={{ id: offering.id, label: `${provider.name} · ${offering.name}` }} />
          <ProviderCTA provider={provider} offeringId={offering.id} source="provider-page-offering" label="Visit" />
        </div>
      </div>
      {offering.modelName && (
        <div className="mt-3">
          <Capabilities offering={offering} />
        </div>
      )}
      {offering.pricing.length > 0 ? (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {offering.pricing.map((price) => (
            <PriceLine key={price.id} price={price} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">No public price recorded yet.</p>
      )}
    </li>
  );
}

export default async function ProviderPage({ params }: { params: Params }) {
  const { slug } = await params;
  const provider = await loadProvider(slug);
  if (!provider) notFound();

  const offerings = await loadOfferings(provider.slug);
  const hasPrices = offerings?.data.some((o) => o.pricing.length > 0) ?? false;

  return (
    <>
      <JsonLd data={providerJsonLd(provider, offerings?.data ?? [])} />
      <PageHeader
        eyebrow={provider.providerTypes.map((t) => PROVIDER_TYPE_LABELS[t]).join(" · ")}
        title={
          <>
            {provider.name}
            <FeaturedBadge provider={provider} className="ml-4 px-2.5 py-0.5 align-middle font-sans text-xs tracking-normal" />
          </>
        }
        description={provider.description ?? undefined}
        aside={<ProviderLogo provider={provider} variant="full" className="hidden h-24 w-24 rounded-2xl text-xl lg:flex" />}
      >
        <div className="flex flex-wrap items-center gap-3">
          <ProviderCTA provider={provider} source="provider-page" variant="accent" size="default" />
          {provider.pricingUrl && (
            <a
              href={provider.pricingUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Provider&apos;s pricing page <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
      </PageHeader>

      <div className="container mx-auto space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <AffiliateDisclosure />

        <section aria-labelledby="offerings" className="space-y-4">
          <h2 id="offerings" className="text-lg font-semibold">Offerings &amp; prices</h2>
          {offerings === null ? (
            <ComputeError what={`${provider.name}'s offerings`} retryHref={`/compute/providers/${provider.slug}`} />
          ) : offerings.data.length === 0 || !hasPrices ? (
            <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center">
              <p className="font-display text-2xl">We haven&apos;t recorded {provider.name}&apos;s prices yet.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Check current rates on their site, or tell us what you need and we&apos;ll point you to options.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ProviderCTA provider={provider} source="provider-page-empty" label="View pricing on provider site" size="default" />
                <Button asChild variant="ghost">
                  <Link href="/compute/request">
                    Tell us what compute you need <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
          {offerings && offerings.data.length > 0 && (
            <ul className="grid gap-4">
              {offerings.data.map((offering) => (
                <OfferingCard key={offering.id} offering={offering} provider={provider} />
              ))}
            </ul>
          )}
          {offerings && offerings.pagination.totalPages > 1 && (
            <p className="text-sm text-muted-foreground">
              Showing the first {offerings.data.length} of {offerings.pagination.total} offerings.
            </p>
          )}
        </section>

        <p className="text-sm">
          <Link href="/compute" className="text-muted-foreground hover:text-foreground">← All compute providers</Link>
        </p>
      </div>
    </>
  );
}
