import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Cpu, MessagesSquare, Server } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/site";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ComputeProviderType, getComputeProviders, type ComputeProvidersResponse } from "@/lib/api";
import { GPU_PAGES, PROVIDER_TYPE_LABELS } from "@/lib/compute";
import { ProviderLogo } from "@/components/compute/ProviderLogo";
import { ComputeError } from "@/components/compute/ComputeStates";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Compare GPU Cloud & AI Inference Providers",
  description:
    "Compare GPU cloud providers, inference APIs and dedicated AI infrastructure — hourly GPU prices, per-token model prices, regions and capabilities.",
  // Type filters fold into the main directory.
  alternates: { canonical: "/compute" },
};

const ENTRY_POINTS = [
  {
    href: "/compute/gpu-cloud",
    icon: Server,
    title: "GPU cloud",
    body: "Rent GPUs by the hour. Compare GPU models, hourly rates, regions and on-demand, spot or reserved billing.",
    cta: "Compare GPU prices",
  },
  {
    href: "/compute/inference",
    icon: MessagesSquare,
    title: "Inference APIs",
    body: "Run hosted models through an API. Compare input and output token prices, context length and API features.",
    cta: "Compare inference prices",
  },
  {
    href: `/compute?type=${ComputeProviderType.DEDICATED_INFERENCE}#providers`,
    icon: Cpu,
    title: "Dedicated inference",
    body: "Managed or reserved capacity for your own deployment — usually quote-based, with no public rate card.",
    cta: "See dedicated providers",
  },
] as const;

const TYPE_FILTERS: (ComputeProviderType | undefined)[] = [undefined, ...Object.values(ComputeProviderType)];

async function loadProviders(type?: ComputeProviderType): Promise<ComputeProvidersResponse | null> {
  try {
    return await getComputeProviders({ type, limit: 100 });
  } catch {
    return null;
  }
}

export default async function ComputePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const typeParam = (await searchParams).type;
  const type = Object.values(ComputeProviderType).find((t) => t === typeParam);
  const providers = await loadProviders(type);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([["Compute", "/compute"]]),
      ...(providers?.data.length
        ? [
            {
              "@type": "ItemList",
              name: "GPU cloud and AI inference providers",
              itemListElement: providers.data.map((provider, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: provider.name,
                url: `${SITE_URL}/compute/providers/${provider.slug}`,
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <PageHeader
        eyebrow="Compute"
        title={<>GPU compute, <em>compared.</em></>}
        description="Compare GPU cloud providers, inference APIs and dedicated AI infrastructure. GPUDealer doesn't rent compute — we show you prices with their sources, then link you to the provider."
      />

      <div className="container mx-auto space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <section aria-label="Compare by category" className="grid gap-4 md:grid-cols-3">
          {ENTRY_POINTS.map(({ href, icon: Icon, title, body, cta }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-colors hover:border-foreground/25"
            >
              <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
              <h2 className="mt-4 font-display text-3xl">{title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{body}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                {cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </section>

        <section aria-labelledby="which" className="grid gap-8 lg:grid-cols-2">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <h2 id="which">GPU cloud or inference API?</h2>
            <p>
              <strong>GPU cloud</strong> gives you the hardware: a machine with one or more GPUs, billed by the hour. You install and
              run your own software — the right choice for training, fine-tuning, or serving models you need full control over.
            </p>
            <p>
              <strong>Inference APIs</strong> give you a model: you send requests and pay per token, with no servers to manage.
              Usually the cheapest way to run popular open models at low or uneven volume.
            </p>
            <p>
              <strong>Dedicated inference</strong> sits in between — a provider runs the model on capacity reserved for you, for
              predictable latency and throughput. Pricing is usually by quote.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">GPU cloud pricing by model</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {GPU_PAGES.map((gpu) => (
                <li key={gpu.slug}>
                  <Link
                    href={`/compute/gpu-cloud/${gpu.slug}`}
                    className="inline-block rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-foreground/30"
                  >
                    {gpu.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-2xl">Need dedicated or enterprise capacity?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tell us the workload, GPUs or models, volume and budget. We&apos;ll come back with options.
              </p>
              <Button asChild variant="accent" className="mt-5">
                <Link href="/compute/request">
                  Tell us what compute you need
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="providers" aria-labelledby="providers-heading" className="scroll-mt-28 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="providers-heading" className="font-display text-4xl">Providers</h2>
            <nav aria-label="Filter providers by type" className="flex flex-wrap gap-1.5">
              {TYPE_FILTERS.map((t) => (
                <Link
                  key={t ?? "all"}
                  href={t ? `/compute?type=${t}#providers` : "/compute#providers"}
                  scroll={false}
                  aria-current={t === type ? "page" : undefined}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    t === type ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30",
                  )}
                >
                  {t ? PROVIDER_TYPE_LABELS[t] : "All"}
                </Link>
              ))}
            </nav>
          </div>

          {providers === null ? (
            <ComputeError what="providers" retryHref={type ? `/compute?type=${type}` : "/compute"} />
          ) : providers.data.length === 0 ? (
            <p className="rounded-3xl border border-border bg-card px-6 py-10 text-center text-muted-foreground">
              No providers of this type yet.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {providers.data.map((provider) => (
                <li key={provider.id}>
                  <Link
                    href={`/compute/providers/${provider.slug}`}
                    className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/25"
                  >
                    <div className="flex items-center gap-3">
                      <ProviderLogo provider={provider} />
                      <div className="min-w-0">
                        <p className="font-medium">{provider.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {provider.providerTypes.map((t) => PROVIDER_TYPE_LABELS[t]).join(" · ")}
                        </p>
                      </div>
                    </div>
                    {provider.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{provider.description}</p>}
                    <p className="mt-auto pt-3 text-xs text-muted-foreground">
                      {provider.offeringCount > 0
                        ? `${provider.offeringCount} ${provider.offeringCount === 1 ? "offering" : "offerings"}`
                        : "Prices not recorded yet"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
