import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { useGetListings, GetListingsCategory, GetListingsCondition, GetListingsSort } from "@workspace/api-client-react";

export function GPUSearch() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  // Parse initial state from URL
  const initialParams = {
    q: searchParams.get("q") || undefined,
    category: (searchParams.get("category") as GetListingsCategory) || undefined,
    vramMin: searchParams.get("vramMin") ? Number(searchParams.get("vramMin")) : undefined,
    priceMax: searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : undefined,
    condition: (searchParams.get("condition") as GetListingsCondition) || undefined,
    sort: (searchParams.get("sort") as GetListingsSort) || undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: 12,
  };

  const [filters, setFilters] = useState(initialParams);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL when filters change (debounced for inputs)
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.vramMin) params.set("vramMin", filters.vramMin.toString());
    if (filters.priceMax) params.set("priceMax", filters.priceMax.toString());
    if (filters.condition) params.set("condition", filters.condition);
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.page && filters.page > 1) params.set("page", filters.page.toString());
    
    const newSearch = params.toString();
    const newUrl = newSearch ? `${location}?${newSearch}` : location;
    
    // Only update if changed to avoid infinite loops
    if (window.location.search !== `?${newSearch}` && (window.location.search || newSearch)) {
      setLocation(newUrl, { replace: true });
    }
  }, [filters, location, setLocation]);

  const { data, isLoading } = useGetListings(filters);

  const updateFilter = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // reset to page 1 on filter change
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 12 });
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex justify-between items-center w-full mb-4">
        <h1 className="text-2xl font-bold text-foreground font-sans">Hardware</h1>
        <Button 
          variant="outline" 
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="font-semibold bg-card"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Sidebar Filters */}
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
              value={filters.q || ""}
              onChange={(e) => updateFilter("q", e.target.value || undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={filters.category || "all"} 
              onValueChange={(val) => updateFilter("category", val === "all" ? undefined : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="gpu">GPUs</SelectItem>
                <SelectItem value="server">Servers</SelectItem>
                <SelectItem value="memory">Memory & Storage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Condition</Label>
            <Select 
              value={filters.condition || "all"} 
              onValueChange={(val) => updateFilter("condition", val === "all" ? undefined : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Condition</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="refurbished">Refurbished</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vram">Min VRAM (GB)</Label>
            <Input 
              id="vram" 
              type="number"
              placeholder="e.g. 24" 
              value={filters.vramMin || ""}
              onChange={(e) => updateFilter("vramMin", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Max Price ($)</Label>
            <Input 
              id="price" 
              type="number"
              placeholder="e.g. 5000" 
              value={filters.priceMax || ""}
              onChange={(e) => updateFilter("priceMax", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <Button variant="outline" className="w-full mt-4" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="hidden md:flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground font-sans">Marketplace</h1>
          
          <div className="flex items-center gap-3">
            <Label className="whitespace-nowrap text-muted-foreground">Sort by:</Label>
            <Select 
              value={filters.sort || "newest"} 
              onValueChange={(val) => updateFilter("sort", val)}
            >
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Newest First" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="relevance">Relevance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Sort */}
        <div className="md:hidden flex items-center gap-2 mb-6">
          <Select 
            value={filters.sort || "newest"} 
            onValueChange={(val) => updateFilter("sort", val)}
          >
            <SelectTrigger className="w-full bg-card">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : data?.listings && data.listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            
            {/* Pagination Placeholder (Simplistic) */}
            {data.total > (filters.limit || 12) && (
              <div className="mt-10 flex justify-center gap-2">
                <Button 
                  variant="outline" 
                  disabled={filters.page === 1}
                  onClick={() => updateFilter("page", (filters.page || 1) - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  disabled={(filters.page || 1) * (filters.limit || 12) >= data.total}
                  onClick={() => updateFilter("page", (filters.page || 1) + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center border border-border rounded-lg bg-card/50 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2">No hardware found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              We couldn't find any listings matching your current filters. Try adjusting your search criteria or submit a hardware request.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button variant="default" onClick={() => setLocation("/request")} className="bg-accent text-white hover:bg-accent/90 border-transparent">
                Request Hardware
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
