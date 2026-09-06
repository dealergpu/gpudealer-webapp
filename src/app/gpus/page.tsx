import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
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

export const metadata: Metadata = {
  title: "Browse Hardware",
  description: "Search used GPUs, AI servers, and memory by model, VRAM, price, and condition.",
};

const PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(searchParams: SearchParams) {
  const q = first(searchParams.q);
  const category = first(searchParams.category) as ListingCategory | undefined;
  const condition = first(searchParams.condition) as ListingCondition | undefined;
  const sortBy = first(searchParams.sortBy) as ListingSortBy | undefined;
  const minVramGb = first(searchParams.minVramGb) ? Number(first(searchParams.minVramGb)) : undefined;
  const maxPrice = first(searchParams.maxPrice) ? Number(first(searchParams.maxPrice)) : undefined;
  const page = first(searchParams.page) ? Number(first(searchParams.page)) : 1;

  return { q, category, condition, sortBy, minVramGb, maxPrice, page };
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
  };

  const pageQuery = (page: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.condition) params.set("condition", filters.condition);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.minVramGb) params.set("minVramGb", String(filters.minVramGb));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `/gpus?${query}` : "/gpus";
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      <SearchFilters initialFilters={currentFilters} />

      <main className="flex-1">
        <div className="hidden md:flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground font-heading">Marketplace</h1>

          <div className="flex items-center gap-3">
            <Label className="whitespace-nowrap text-muted-foreground">Sort by:</Label>
            <SortSelect value={filters.sortBy} />
          </div>
        </div>

        <div className="md:hidden flex items-center gap-2 mb-6">
          <SortSelect value={filters.sortBy} />
        </div>

        {result === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : result.data.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.data.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {result.pagination.totalPages > 1 && (
              <div className="mt-10 flex justify-center gap-2">
                {filters.page > 1 && (
                  <Link href={pageQuery(filters.page - 1)}>
                    <Button variant="outline">Previous</Button>
                  </Link>
                )}
                {filters.page < result.pagination.totalPages && (
                  <Link href={pageQuery(filters.page + 1)}>
                    <Button variant="outline">Next</Button>
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center border border-border rounded-lg bg-card/50 flex flex-col items-center">
            <h3 className="text-xl font-bold font-heading mb-2">No hardware found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              We couldn't find any listings matching your current filters. Try adjusting your search criteria or submit a hardware request.
            </p>
            <div className="flex gap-4">
              <Link href="/gpus">
                <Button variant="outline">Clear Filters</Button>
              </Link>
              <Link href="/request">
                <Button variant="default" className="bg-accent text-white hover:bg-accent/90 border-transparent">
                  Request Hardware
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
