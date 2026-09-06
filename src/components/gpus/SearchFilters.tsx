'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
};

function buildQuery(filters: SearchFilterValues): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.minVramGb) params.set("minVramGb", String(filters.minVramGb));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  return params.toString();
}

export function SearchFilters({ initialFilters }: { initialFilters: SearchFilterValues }) {
  const router = useRouter();
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
      <div className="md:hidden flex justify-between items-center w-full mb-4">
        <h1 className="text-2xl font-bold text-foreground font-heading">Hardware</h1>
        <Button
          variant="outline"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="font-semibold bg-card"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <aside className={`
        ${mobileFiltersOpen ? 'flex' : 'hidden'}
        md:flex flex-col w-full md:w-64 shrink-0 bg-card border border-border rounded-lg p-5 h-fit shadow-sm
      `}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
            Filters
          </h2>
          {mobileFiltersOpen && (
            <Button variant="ghost" size="icon" onClick={() => setMobileFiltersOpen(false)} className="md:hidden">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Model, manufacturer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={filters.category || "all"}
              onValueChange={(val) => updateFilter("category", val === "all" ? undefined : (val as ListingCategory))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value={ListingCategory.GPU}>GPUs</SelectItem>
                <SelectItem value={ListingCategory.SERVER}>Servers</SelectItem>
                <SelectItem value={ListingCategory.MEMORY}>Memory & Storage</SelectItem>
                <SelectItem value={ListingCategory.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Condition</Label>
            <Select
              value={filters.condition || "all"}
              onValueChange={(val) => updateFilter("condition", val === "all" ? undefined : (val as ListingCondition))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Condition</SelectItem>
                <SelectItem value={ListingCondition.NEW}>New</SelectItem>
                <SelectItem value={ListingCondition.USED}>Used</SelectItem>
                <SelectItem value={ListingCondition.REFURBISHED}>Refurbished</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vram">Min VRAM (GB)</Label>
            <Input
              id="vram"
              type="number"
              placeholder="e.g. 24"
              value={filters.minVramGb || ""}
              onChange={(e) => updateFilter("minVramGb", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Max Price ($)</Label>
            <Input
              id="price"
              type="number"
              placeholder="e.g. 5000"
              value={filters.maxPrice || ""}
              onChange={(e) => updateFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <Button variant="outline" className="w-full mt-4" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </aside>
    </>
  );
}

export function SortSelect({ value }: { value?: ListingSortBy }) {
  const router = useRouter();

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
      <SelectTrigger className="w-[180px] bg-card">
        <SelectValue placeholder="Newest First" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ListingSortBy.newest}>Newest First</SelectItem>
        <SelectItem value={ListingSortBy.price_asc}>Price: Low to High</SelectItem>
        <SelectItem value={ListingSortBy.price_desc}>Price: High to Low</SelectItem>
        <SelectItem value={ListingSortBy.relevance}>Relevance</SelectItem>
      </SelectContent>
    </Select>
  );
}
