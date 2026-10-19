import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ListingCard";
import { SearchFilters, SortSelect, type SearchFilterValues } from "@/components/gpus/SearchFilters";
import {
  getListings,
  type ListingCategory,
  type ListingCondition,
  type ListingSortBy,
  type ListingsResponse,
} from "@/lib/api";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const CATEGORY_TITLES: Record<string, string> = {
  GPU: "Used GPUs",
  SERVER: "Used GPU & AI Servers",
  MEMORY: "Used Server Memory",
  OTHER: "Other AI Hardware",
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = first(params.category);
  const categoryTitle = category ? CATEGORY_TITLES[category] : undefined;
  return {
    title: categoryTitle ?? "Browse Hardware",
    description: "Search used GPUs, AI servers, and memory by model, VRAM, price, and condition.",
    // Category views are distinct landing pages; every other filter combo
    // folds into its category (or the main search) to avoid duplicate URLs.
    alternates: { canonical: categoryTitle ? `/gpus?category=${category}` : "/gpus" },
  };
}

const PAGE_SIZE = 12;

function parseFilters(searchParams: SearchParams) {
  const q = first(searchParams.q);
  const category = first(searchParams.category) as ListingCategory | undefined;
  const condition = first(searchParams.condition) as ListingCondition | undefined;
  const sortBy = first(searchParams.sortBy) as ListingSortBy | undefined;
  const minVramGb = first(searchParams.minVramGb) ? Number(first(searchParams.minVramGb)) : undefined;
  const maxPrice = first(searchParams.maxPrice) ? Number(first(searchParams.maxPrice)) : undefined;
  const page = first(searchParams.page) ? Number(first(searchParams.page)) : 1;
  const city = first(searchParams.city);
  const country = first(searchParams.country);

  return { q, category, condition, sortBy, minVramGb, maxPrice, page, city, country };
}

async function loadListings(filters: ReturnType<typeof parseFilters>): Promise<ListingsResponse | null> {
  try {
    return await getListings({ ...filters, limit: PAGE_SIZE });
  } catch {
    return null;
  }
}

export default async function GPUSearch({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);
  const result = await loadListings(filters);

  const currentFilters: SearchFilterValues = {
    q: filters.q,
    category: filters.category,
    condition: filters.condition,
    sortBy: filters.sortBy,
    minVramGb: filters.minVramGb,
    maxPrice: filters.maxPrice,
    city: filters.city,
    country: filters.country,
  };

  const pageQuery = (page: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.condition) params.set("condition", filters.condition);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.minVramGb) params.set("minVramGb", String(filters.minVramGb));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters.city) params.set("city", filters.city);
    if (filters.country) params.set("country", filters.country);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `/gpus?${query}` : "/gpus";
  };

  const total = result?.pagination.total;

  return (
    <>
      <PageHeader
        eyebrow="Find hardware"
        title={
          filters.q ? <>Results for <em>&ldquo;{filters.q}&rdquo;</em></>
          : filters.city ? <>Hardware in <em>{filters.city}</em></>
          : <>Used GPUs &amp; <em>AI hardware</em></>
        }
        description="Filter by model, VRAM, price and condition. Every listing shows where it came from."
      />

      <div className="container mx-auto flex flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row lg:px-8">
        <SearchFilters initialFilters={currentFilters} />

        <section className="min-w-0 flex-1" aria-label="Search results">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {total != null ? (
                <>
                  <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString("en-US")}</span>{" "}
                  {total === 1 ? "listing" : "listings"}
                </>
              ) : (
                "Search results"
              )}
            </p>
            <div className="flex items-center gap-3">
              <Label className="hidden whitespace-nowrap text-muted-foreground sm:block">Sort by</Label>
              <SortSelect value={filters.sortBy} />
            </div>
          </div>

          {result === null ? (
            <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center">
              <p className="font-display text-3xl">We couldn&apos;t load listings.</p>
              <p className="mt-2 text-muted-foreground">The marketplace is temporarily unavailable. Please try again shortly.</p>
              <Button asChild variant="outline" className="mt-6">
                <Link href={pageQuery(filters.page)}>Try again</Link>
              </Button>
            </div>
          ) : result.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.data.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {result.pagination.totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
                  {filters.page > 1 && (
                    <Button asChild variant="outline">
                      <Link href={pageQuery(filters.page - 1)}>Previous</Link>
                    </Button>
                  )}
                  <span className="px-2 font-mono text-xs text-muted-foreground">
                    {filters.page} / {result.pagination.totalPages}
                  </span>
                  {filters.page < result.pagination.totalPages && (
                    <Button asChild variant="outline">
                      <Link href={pageQuery(filters.page + 1)}>Next</Link>
                    </Button>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div data-nav="dark" className="dark relative overflow-hidden rounded-3xl bg-background px-6 py-16 text-center text-foreground md:py-20">
              <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(357_90%_50%/0.25),transparent)] blur-2xl" />
              <div className="relative">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">No matching hardware found.</p>
                <h2 className="mx-auto mt-4 max-w-md font-display text-4xl leading-tight md:text-5xl">
                  Can&apos;t find what you&apos;re looking for?
                </h2>
                <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                  Tell us the model, quantity and budget — we&apos;ll search our supply network for you.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button asChild size="lg" variant="accent">
                    <Link href="/request">
                      Request Hardware
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/gpus">Clear filters</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
