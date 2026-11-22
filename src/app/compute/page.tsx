import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Cpu, MessagesSquare, Server } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/site";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ComputeProviderType, GetComputeProvidersFeatured, getComputeProviders, type ComputeProvider } from "@/lib/api";
import { GPU_PAGES } from "@/lib/compute";
import { ProviderCard } from "@/components/compute/ProviderCard";

export const metadata: Metadata = {
  title: "Compare GPU Cloud & AI Inference Providers",
  description:
    "Compare GPU cloud providers, inference APIs and dedicated AI infrastructure — hourly GPU prices, per-token model prices, regions and capabilities.",
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
    href: `/compute/providers?type=${ComputeProviderType.DEDICATED_INFERENCE}`,
    icon: Cpu,
    title: "Dedicated inference",
    body: "Managed or reserved capacity for your own deployment — usually quote-based, with no public rate card.",
    cta: "See dedicated providers",
  },
] as const;

// Featured providers strip, in the API's order. Hidden when there are none
// or the request fails — it's never the only way into the directory.
async function loadFeaturedProviders(): Promise<ComputeProvider[]> {
  try {
    return (await getComputeProviders({ featured: GetComputeProvidersFeatured.true, limit: 6 })).data;
  } catch {
    return [];
  }
}

export default async function ComputePage() {
  const featured = await loadFeaturedProviders();

  const structuredData = { "@context": "https://schema.org", ...breadcrumbJsonLd([["Compute", "/compute"]]) };

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

        {featured.length > 0 && (
          <section aria-labelledby="featured-heading" className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="featured-heading" className="font-display text-4xl">Featured providers</h2>
              <Link href="/compute/providers" className="inline-flex items-center gap-1.5 text-sm font-medium">
                All providers <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((provider) => (
                <li key={provider.id}>
                  <ProviderCard provider={provider} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <p>
          <Link href="/compute/providers" className="inline-flex items-center gap-1.5 text-sm font-medium">
            Browse all compute providers <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </div>
    </>
  );
}
