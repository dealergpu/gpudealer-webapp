import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ArrowRight, Activity, HardDrive, Cpu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { useGetFeaturedListings, useGetMarketplaceStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: featured, isLoading: isLoadingFeatured } = useGetFeaturedListings({ limit: 4 });
  const { data: stats } = useGetMarketplaceStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/gpus?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation(`/gpus`);
    }
  };

  const quickFilters = [
    "RTX 3090", "RTX 4090", "H100", "A100", "A6000", "24GB+", "48GB+", "80GB+"
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative bg-background border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-background to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 border-accent/30 text-accent bg-accent/5 px-3 py-1 font-mono uppercase tracking-wider text-xs">
              <Activity className="w-3 h-3 mr-2 inline" />
              Live Marketplace
            </Badge>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-foreground font-sans"
          >
            The Professional Exchange for <br className="hidden md:block" />
            <span className="text-accent italic pr-2">AI Compute</span> Hardware
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl"
          >
            Buy, sell, and source high-end GPUs, server racks, and memory for data centers and AI engineering. Verified listings, professional buyers.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-2xl mb-8"
          >
            <form onSubmit={handleSearch} className="flex gap-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                type="text" 
                placeholder="Search models, VRAM, or manufacturers (e.g., 'H100 80GB')" 
                className="pl-12 h-14 text-base font-medium shadow-sm border-border bg-card focus-visible:ring-accent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="lg" className="h-14 px-8 font-bold">
                Search
              </Button>
            </form>
            
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">Trending:</span>
              {quickFilters.map((filter) => (
                <Link key={filter} href={`/gpus?q=${encodeURIComponent(filter)}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-border transition-colors font-mono text-[10px]">
                    {filter}
                  </Badge>
                </Link>
              ))}
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mt-8">
            <Link href="/gpus" className="w-full">
              <Button variant="outline" className="w-full h-16 text-base font-semibold border-border bg-card hover:bg-accent/5 hover:text-accent hover:border-accent/30 group">
                <HardDrive className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-accent" />
                Find Hardware
              </Button>
            </Link>
            <Link href="/sell" className="w-full">
              <Button variant="outline" className="w-full h-16 text-base font-semibold border-border bg-card hover:bg-accent/5 hover:text-accent hover:border-accent/30 group">
                <Cpu className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-accent" />
                Sell Your Hardware
              </Button>
            </Link>
            <Link href="/request" className="w-full">
              <Button variant="outline" className="w-full h-16 text-base font-semibold border-border bg-card hover:bg-accent/5 hover:text-accent hover:border-accent/30 group">
                <Search className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-accent" />
                Request Hardware
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-foreground text-background py-8 border-y border-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-background/20 text-center">
            <div className="px-4">
              <div className="text-3xl font-bold font-mono text-white">{stats?.totalListings || "..."}</div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold mt-1">Active Listings</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-bold font-mono text-white">{stats?.totalRequests || "..."}</div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold mt-1">Open Requests</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-bold font-mono text-white">$10M+</div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold mt-1">Market Volume</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-bold font-mono text-white text-accent">24/7</div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold mt-1">Trading Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">Featured Hardware</h2>
              <p className="text-muted-foreground mt-2">Premium listings available right now.</p>
            </div>
            <Link href="/gpus">
              <Button variant="ghost" className="hidden sm:flex group font-semibold">
                View all hardware
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingFeatured ? (
              Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)
            ) : featured && featured.length > 0 ? (
              featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-lg">
                <p className="text-muted-foreground font-medium">No featured listings at the moment.</p>
              </div>
            )}
          </div>
          
          <Link href="/gpus" className="mt-8 flex justify-center sm:hidden">
            <Button variant="outline" className="w-full font-semibold">
              View all hardware
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Industrial-Grade Sourcing</h2>
            <p className="text-muted-foreground text-lg">
              We connect enterprise buyers with verified hardware sellers. No fluff, just specs and prices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center group">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6 group-hover:bg-accent/10 group-hover:text-accent transition-colors border border-border">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Search & Filter</h3>
              <p className="text-muted-foreground">Find exact models, VRAM requirements, and condition using our specialized technical filters.</p>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6 group-hover:bg-accent/10 group-hover:text-accent transition-colors border border-border">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Compare & Verify</h3>
              <p className="text-muted-foreground">Review dense specifications, pricing, and seller details to make a confident technical purchase.</p>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6 group-hover:bg-accent/10 group-hover:text-accent transition-colors border border-border">
                <Activity className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Connect & Transact</h3>
              <p className="text-muted-foreground">Contact sellers directly or fulfill open hardware requests if you have inventory to move.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-foreground text-background text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-white">Can't find what you need?</h2>
          <p className="text-lg text-muted mb-10 max-w-xl mx-auto">
            Post a hardware request. Our network of resellers and data centers will be notified of your exact requirements.
          </p>
          <Link href="/request">
            <Button size="lg" variant="default" className="h-14 px-8 font-bold bg-accent hover:bg-accent/90 text-white border-0">
              Submit Hardware Request
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
