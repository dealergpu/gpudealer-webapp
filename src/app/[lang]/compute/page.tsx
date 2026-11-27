import { Link } from "@/i18n/navigation";
import { alternatesFor, getI18n } from "@/i18n/server";
import type { Metadata } from "next";
import { ArrowRight, Cpu, MessagesSquare, Server } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/site";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ComputeProviderType, GetComputeProvidersFeatured, getComputeProviders, type ComputeProvider } from "@/lib/api";
import { GPU_PAGES } from "@/lib/compute";
import { ProviderCard } from "@/components/compute/ProviderCard";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.computeHome.metaTitle,
    description: t.computeHome.metaDescription,
    alternates: await alternatesFor("/compute"),
  };
}

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
  const [featured, { t, locale }] = await Promise.all([loadFeaturedProviders(), getI18n()]);
  const c = t.computeHome;
  const entryPoints = [
    { href: "/compute/gpu-cloud", icon: Server, title: c.gpuCloudTitle, body: c.gpuCloudBody, cta: c.gpuCloudCta },
    { href: "/compute/inference", icon: MessagesSquare, title: c.inferenceTitle, body: c.inferenceBody, cta: c.inferenceCta },
    {
      href: `/compute/providers?type=${ComputeProviderType.DEDICATED_INFERENCE}`,
      icon: Cpu,
      title: c.dedicatedTitle,
      body: c.dedicatedBody,
      cta: c.dedicatedCta,
    },
  ];

  const structuredData = { "@context": "https://schema.org", ...breadcrumbJsonLd([[t.computeUi.breadcrumbCompute, "/compute"]], locale) };

  return (
    <>
      <JsonLd data={structuredData} />
      <PageHeader
        eyebrow={c.eyebrow}
        title={<>{c.titleStart} <em>{c.titleEm}</em></>}
        description={c.description}
      />

      <div className="container mx-auto space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <section aria-label={c.byCategory} className="grid gap-4 md:grid-cols-3">
          {entryPoints.map(({ href, icon: Icon, title, body, cta }) => (
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
            <h2 id="which">{c.whichTitle}</h2>
            <p>
              <strong>{c.whichGpuCloudStrong}</strong> {c.whichGpuCloud}
            </p>
            <p>
              <strong>{c.whichInferenceStrong}</strong> {c.whichInference}
            </p>
            <p>
              <strong>{c.whichDedicatedStrong}</strong> {c.whichDedicated}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">{c.pricingByModel}</h2>
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
              <h2 className="font-display text-2xl">{c.enterpriseTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {c.enterpriseBody}
              </p>
              <Button asChild variant="accent" className="mt-5">
                <Link href="/compute/request">
                  {t.computeUi.tellUsCompute}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {featured.length > 0 && (
          <section aria-labelledby="featured-heading" className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="featured-heading" className="font-display text-4xl">{c.featuredProviders}</h2>
              <Link href="/compute/providers" className="inline-flex items-center gap-1.5 text-sm font-medium">
                {c.allProviders} <ArrowRight className="h-4 w-4" aria-hidden />
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
            {c.browseAll} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </div>
    </>
  );
}
