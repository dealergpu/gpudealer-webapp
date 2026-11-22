import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ComputeProviderType,
  GetComputeProvidersFeatured,
  getComputeProviders,
  type ComputeProvider,
  type ComputeProvidersResponse,
} from "@/lib/api";
import { PROVIDER_TYPE_LABELS } from "@/lib/compute";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProviderCard } from "@/components/compute/ProviderCard";
import { AffiliateDisclosure } from "@/components/compute/AffiliateDisclosure";
import { ComputeError, Pager } from "@/components/compute/ComputeStates";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 48;
const TYPES = Object.values(ComputeProviderType);

export const metadata: Metadata = {
  title: "GPU Cloud & AI Inference Providers",
  description:
    "Directory of GPU cloud, inference API, serverless and dedicated AI infrastructure providers, with their services and recorded prices.",
  // Filtered views fold into the full directory.
  alternates: { canonical: "/compute/providers" },
};

type Filters = { type?: ComputeProviderType; featured: boolean; page: number };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function directoryHref({ type, featured, page }: Filters): string {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (featured) params.set("featured", "true");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/compute/providers?${query}` : "/compute/providers";
}

async function loadPage(
  { type, page }: Filters,
  featured: GetComputeProvidersFeatured | undefined,
): Promise<ComputeProvidersResponse | null> {
  try {
    return await getComputeProviders({ type, featured, page, limit: PAGE_SIZE });
  } catch {
    return null;
  }
}

/**
 * Featured providers first, then everyone else A–Z: the featured ones are
 * loaded in full (`featured=true`) and the rest are paged (`featured=false`),
 * so pinning holds on every page. If the featured request fails, falls back
 * to the plain A–Z list.
 */
async function loadDirectory(filters: Filters): Promise<{ pinned: ComputeProvider[]; rest: ComputeProvidersResponse | null }> {
  if (filters.featured) return { pinned: [], rest: await loadPage(filters, GetComputeProvidersFeatured.true) };
  const featured = await getComputeProviders({ type: filters.type, featured: GetComputeProvidersFeatured.true, limit: 100 })
    .then((result) => result.data)
    .catch(() => null);
  const rest = await loadPage(filters, featured ? GetComputeProvidersFeatured.false : undefined);
  return { pinned: featured ?? [], rest };
}

const PILL = "rounded-full border px-3 py-1 text-xs transition-colors";
const PILL_ON = "border-foreground bg-foreground text-background";
const PILL_OFF = "border-border hover:border-foreground/30";

export default async function ComputeProvidersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters: Filters = {
    type: TYPES.find((t) => t === first(params.type)),
    featured: first(params.featured) === "true",
    page: Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1),
  };
  const { pinned, rest: providers } = await loadDirectory(filters);
  const filtered = Boolean(filters.type || filters.featured);
  const shown = [...(filters.page === 1 ? pinned : []), ...(providers?.data ?? [])];
  const total = (providers?.pagination.total ?? 0) + pinned.length;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        ["Compute", "/compute"],
        ["Providers", "/compute/providers"],
      ]),
      ...(shown.length
        ? [
            {
              "@type": "ItemList",
              name: "GPU cloud and AI inference providers",
              itemListElement: shown.map((provider, i) => ({
                "@type": "ListItem",
                position: (filters.page === 1 ? 0 : pinned.length + (filters.page - 1) * PAGE_SIZE) + i + 1,
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
        title={<>Compute <em>providers</em></>}
        description="GPU clouds, inference APIs, serverless GPUs and dedicated AI infrastructure. Open a provider to see its offerings and the prices we've recorded."
      />

      <div className="container mx-auto space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Filter providers" className="flex flex-wrap items-center gap-1.5">
          <Link
            href={directoryHref({ ...filters, featured: !filters.featured, page: 1 })}
            scroll={false}
            aria-current={filters.featured ? "true" : undefined}
            className={cn(PILL, filters.featured ? PILL_ON : PILL_OFF)}
          >
            Featured
          </Link>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          {[undefined, ...TYPES].map((t) => (
            <Link
              key={t ?? "all"}
              href={directoryHref({ ...filters, type: t, page: 1 })}
              scroll={false}
              aria-current={t === filters.type ? "true" : undefined}
              className={cn(PILL, t === filters.type ? PILL_ON : PILL_OFF)}
            >
              {t ? PROVIDER_TYPE_LABELS[t] : "All types"}
            </Link>
          ))}
        </nav>

        {providers === null ? (
          <ComputeError what="providers" retryHref={directoryHref(filters)} />
        ) : shown.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center">
            <p className="font-display text-2xl">No providers match these filters.</p>
            {filtered && (
              <Button asChild variant="outline" className="mt-5">
                <Link href="/compute/providers">Clear filters</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "provider" : "providers"}
              {pinned.length > 0 && " · featured first"}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((provider) => (
                <li key={provider.id}>
                  <ProviderCard provider={provider} />
                </li>
              ))}
            </ul>
            <Pager
              page={providers.pagination.page}
              totalPages={providers.pagination.totalPages}
              href={(page) => directoryHref({ ...filters, page })}
            />
          </>
        )}

        <AffiliateDisclosure />
      </div>
    </>
  );
}
