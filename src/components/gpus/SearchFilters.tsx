'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListingCategory, ListingCondition, ListingSortBy } from "@/lib/api";

export type SearchFilterValues = {
  q?: string;
  category?: ListingCategory;
  condition?: ListingCondition;
  minVramGb?: number;
  maxPrice?: number;
  sortBy?: ListingSortBy;
  // Set by "browse by city" links; there's no UI control for them, they're
  // just carried through so changing another filter keeps the location.
  city?: string;
  country?: string;
};

function buildQuery(filters: SearchFilterValues): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.minVramGb) params.set("minVramGb", String(filters.minVramGb));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.city) params.set("city", filters.city);
  if (filters.country) params.set("country", filters.country);
  return params.toString();
}

export function SearchFilters({ initialFilters }: { initialFilters: SearchFilterValues }) {
  const router = useRouter();
  const { t } = useI18n();
  const s = t.search;
  const [filters, setFilters] = useState<SearchFilterValues>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.q ?? "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = (next: SearchFilterValues) => {
    const query = buildQuery(next);
    router.push(query ? `/gpus?${query}` : "/gpus", { scroll: false });
  };

  const updateFilter = <K extends keyof SearchFilterValues>(key: K, value: SearchFilterValues[K] | undefined) => {
    const next = { ...filters, [key]: value || undefined };
    setFilters(next);
    navigate(next);
  };

  // Debounce the free-text search so every keystroke doesn't trigger a
  // server round-trip.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== (filters.q ?? "")) {
        updateFilter("q", searchInput || undefined);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const clearFilters = () => {
    setFilters({});
    setSearchInput("");
    router.push("/gpus", { scroll: false });
  };

  return (
    <>
      <div className="flex w-full items-center justify-between md:hidden">
        <p className="text-sm text-muted-foreground">{s.refine}</p>
        <Button
          variant="outline"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          aria-expanded={mobileFiltersOpen}
          aria-controls="search-filters"
        >
          <Filter className="h-4 w-4" />
          {s.filters}
        </Button>
      </div>

      <aside
        id="search-filters"
        className={`
        ${mobileFiltersOpen ? 'flex' : 'hidden'}
        md:flex flex-col w-full md:w-64 shrink-0 rounded-3xl border border-border bg-card p-6 h-fit md:sticky md:top-24
      `}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            {s.filters}
          </h2>
          {mobileFiltersOpen && (
            <Button variant="ghost" size="icon" onClick={() => setMobileFiltersOpen(false)} className="md:hidden" aria-label={s.closeFilters}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="search">{s.searchLabel}</Label>
            <Input
              id="search"
              placeholder={s.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{s.category}</Label>
            <Select
              value={filters.category || "all"}
              onValueChange={(val) => updateFilter("category", val === "all" ? undefined : (val as ListingCategory))}
            >
              <SelectTrigger>
                <SelectValue placeholder={s.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{s.allCategories}</SelectItem>
                <SelectItem value={ListingCategory.GPU}>{s.catGpu}</SelectItem>
                <SelectItem value={ListingCategory.SERVER}>{s.catServer}</SelectItem>
                <SelectItem value={ListingCategory.MEMORY}>{s.catMemory}</SelectItem>
                <SelectItem value={ListingCategory.OTHER}>{s.catOther}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{s.condition}</Label>
            <Select
              value={filters.condition || "all"}
              onValueChange={(val) => updateFilter("condition", val === "all" ? undefined : (val as ListingCondition))}
            >
              <SelectTrigger>
                <SelectValue placeholder={s.anyCondition} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{s.anyCondition}</SelectItem>
                <SelectItem value={ListingCondition.NEW}>{t.condition.NEW}</SelectItem>
                <SelectItem value={ListingCondition.USED}>{t.condition.USED}</SelectItem>
                <SelectItem value={ListingCondition.REFURBISHED}>{t.condition.REFURBISHED}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vram">{s.minVram}</Label>
            <Input
              id="vram"
              type="number"
              placeholder={s.minVramPlaceholder}
              value={filters.minVramGb || ""}
              onChange={(e) => updateFilter("minVramGb", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">{s.maxPrice}</Label>
            <Input
              id="price"
              type="number"
              placeholder={s.maxPricePlaceholder}
              value={filters.maxPrice || ""}
              onChange={(e) => updateFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <Button variant="outline" className="w-full mt-4" onClick={clearFilters}>
            {s.clearFiltersButton}
          </Button>
        </div>
      </aside>
    </>
  );
}

export function SortSelect({ value }: { value?: ListingSortBy }) {
  const router = useRouter();
  const { t } = useI18n();
  const s = t.search;

  const onChange = (sortBy: string) => {
    const params = new URLSearchParams(window.location.search);
    if (sortBy === ListingSortBy.newest) {
      params.delete("sortBy");
    } else {
      params.set("sortBy", sortBy);
    }
    const query = params.toString();
    router.push(query ? `/gpus?${query}` : "/gpus", { scroll: false });
  };

  return (
    <Select value={value || ListingSortBy.newest} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] rounded-full bg-card">
        <SelectValue placeholder={s.sortNewest} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ListingSortBy.newest}>{s.sortNewest}</SelectItem>
        <SelectItem value={ListingSortBy.price_asc}>{s.sortPriceAsc}</SelectItem>
        <SelectItem value={ListingSortBy.price_desc}>{s.sortPriceDesc}</SelectItem>
        <SelectItem value={ListingSortBy.relevance}>{s.sortRelevance}</SelectItem>
      </SelectContent>
    </Select>
  );
}
