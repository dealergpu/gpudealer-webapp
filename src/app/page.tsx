import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { HeroIntro } from "@/components/home/HeroIntro";
import { getFeaturedListings, getMarketplaceStats, type Listing, type MarketplaceStats } from "@/lib/api";

// Revalidate periodically so the homepage stays reasonably fresh without
// refetching on every single request.
export const revalidate = 60;

async function loadHomeData(): Promise<{
  featured: Listing[] | null;
  stats: MarketplaceStats | null;
}> {
  try {
    const [featured, stats] = await Promise.all([
      getFeaturedListings({ limit: 4 }),
      getMarketplaceStats(),
    ]);
    return { featured, stats };
  } catch {
    // No backend reachable yet (or a transient error) — degrade gracefully
    // instead of taking the whole page down.
    return { featured: null, stats: null };
  }
}

export default async function Home() {
  const { featured, stats } = await loadHomeData();

  return (
    <div className="flex flex-col w-full">
      <HeroIntro />

      {/* Stats Section */}
      <section className="bg-card py-8 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border text-center">
            <div className="px-4">
              <div className="text-3xl font-bold font-mono text-foreground">{stats?.totalListings ?? "..."}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Active Listings</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-bold font-mono text-foreground">{stats?.totalRequests ?? "..."}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Open Requests</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-bold font-mono text-foreground">$10M+</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Market Volume</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-bold font-mono text-accent">24/7</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">Trading Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">Featured Hardware</h2>
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
            {featured === null ? (
              Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)
            ) : featured.length > 0 ? (
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
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading mb-4">Industrial-Grade Sourcing</h2>
            <p className="text-muted-foreground text-lg">
              We connect enterprise buyers with verified hardware sellers. No fluff, just specs and prices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center group">
              <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center mb-6 group-hover:bg-accent/10 group-hover:text-accent group-hover:border-accent/40 transition-colors border border-border">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-heading">1. Search & Filter</h3>
              <p className="text-muted-foreground">Find exact models, VRAM requirements, and condition using our specialized technical filters.</p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center mb-6 group-hover:bg-accent/10 group-hover:text-accent group-hover:border-accent/40 transition-colors border border-border">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-heading">2. Compare & Verify</h3>
              <p className="text-muted-foreground">Review dense specifications, pricing, and seller details to make a confident technical purchase.</p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center mb-6 group-hover:bg-accent/10 group-hover:text-accent group-hover:border-accent/40 transition-colors border border-border">
                <Activity className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-heading">3. Connect & Transact</h3>
              <p className="text-muted-foreground">Contact sellers directly or fulfill open hardware requests if you have inventory to move.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24 px-4 text-center bg-background">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_50%_80%_at_50%_50%,black,transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/15 via-background to-background" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-foreground font-heading">Can't find what you need?</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Post a hardware request. Our network of resellers and data centers will be notified of your exact requirements.
          </p>
          <Link href="/request">
            <Button size="lg" variant="default" className="h-14 px-8 font-bold glow-accent">
              Submit Hardware Request
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
