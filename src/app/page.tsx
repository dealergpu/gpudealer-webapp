import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, ExternalLink, Search, Tag, UserRound, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { HeroIntro } from "@/components/home/HeroIntro";
import { CountUp, Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { getListings, getMarketplaceStats, ListingSortBy, ListingStatus, type Listing, type MarketplaceStats } from "@/lib/api";

// Render per request. `revalidate` (ISR) needs an OpenNext incremental cache
// (R2/KV) on Cloudflare, which isn't configured — without it the page stays
// frozen at whatever the API returned during the build.
export const dynamic = "force-dynamic";

const DEFAULT_MODELS = [
  "RTX 3090", "RTX 3090 Ti", "RTX 4090", "RTX 5090", "RTX A5000", "RTX A6000",
  "RTX 6000 Ada", "A100 80GB", "H100", "H200", "8-GPU server", "DDR5 ECC RDIMM",
];

const VRAM_TIERS = [
  { gb: 24, models: "RTX 3090 · RTX 4090 · A5000" },
  { gb: 32, models: "RTX 5090" },
  { gb: 48, models: "RTX A6000 · RTX 6000 Ada" },
  { gb: 80, models: "A100 · H100 · H200", plus: true },
];

const ACTIONS = [
  {
    n: "01",
    href: "/gpus",
    icon: Search,
    title: "Find hardware",
    body: "Search used GPUs, servers and memory by model, VRAM, price, condition and location. No account needed.",
    cta: "Browse listings",
  },
  {
    n: "02",
    href: "/sell",
    icon: Tag,
    title: "Sell your hardware",
    body: "List a single card or a rack of them in under three minutes. Reach buyers who are looking for exactly that.",
    cta: "Create a listing",
  },
  {
    n: "03",
    href: "/request",
    icon: Inbox,
    title: "Request hardware",
    body: "Can't find it? Tell us the model, quantity, budget and destination — we'll work the supply side for you.",
    cta: "Post a request",
  },
];

async function loadHomeData(): Promise<{
  featured: Listing[] | null;
  stats: MarketplaceStats | null;
}> {
  // Settled independently so one failing endpoint (e.g. stats not deployed
  // yet) doesn't blank out the other — degrade gracefully per section.
  const [listings, stats] = await Promise.allSettled([
    getListings({ status: ListingStatus.PUBLISHED, sortBy: ListingSortBy.newest, limit: 8 }),
    getMarketplaceStats(),
  ]);
  return {
    featured: listings.status === "fulfilled" ? listings.value.data : null,
    stats: stats.status === "fulfilled" ? stats.value : null,
  };
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{children}</p>;
}

export default async function Home() {
  const { featured, stats } = await loadHomeData();
  const models = stats?.popularModels?.length
    ? [...new Set([...stats.popularModels.map((m) => m.model), ...DEFAULT_MODELS])].slice(0, 14)
    : DEFAULT_MODELS;

  return (
    <div className="flex w-full flex-col">
      <HeroIntro />

      {/* Popular searches rail */}
      <section data-nav="dark" aria-label="Popular searches" className="dark border-t border-white/[0.06] bg-background py-6 text-foreground">
        <div className="mask-fade-x flex overflow-hidden">
          <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10 [--marquee-duration:55s] hover:[animation-play-state:paused]">
            {[...models, ...models].map((model, i) => (
              <Link
                key={`${model}-${i}`}
                href={`/gpus?q=${encodeURIComponent(model)}`}
                aria-hidden={i >= models.length ? true : undefined}
                tabIndex={i >= models.length ? -1 : undefined}
                className="flex items-center gap-10 whitespace-nowrap font-display text-2xl text-foreground/50 transition-colors hover:text-foreground md:text-3xl"
              >
                {model}
                <span className="h-1.5 w-1.5 rounded-full bg-accent/70" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Three primary actions */}
      <section className="bg-background py-24 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14 grid gap-6 md:grid-cols-2 md:items-end">
            <Reveal>
              <SectionEyebrow>How GPUDealer works</SectionEyebrow>
              <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl">
                Three ways <em className="text-accent">in.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="max-w-md text-lg text-muted-foreground md:justify-self-end">
                A discovery network for used AI hardware — built for the person buying one card and the team sourcing a hundred.
              </p>
            </Reveal>
          </div>

          <RevealGroup className="grid gap-4 md:grid-cols-3">
            {ACTIONS.map((action, i) => {
              const featuredAction = i === 2;
              return (
                <RevealItem key={action.href} className={featuredAction ? "dark" : undefined}>
                  <Link href={action.href} className="block h-full">
                    <SpotlightCard
                      className={`card-hover flex h-full min-h-[320px] flex-col rounded-3xl border p-7 ${
                        featuredAction ? "border-white/10 bg-background text-foreground" : "border-border bg-card"
                      }`}
                    >
                      <div className="relative flex items-start justify-between">
                        <span className="font-mono text-xs text-muted-foreground">{action.n}</span>
                        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/10 transition-all duration-500 group-hover/spot:rotate-[-45deg] group-hover/spot:border-transparent group-hover/spot:bg-accent group-hover/spot:text-white">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="relative mt-auto">
                        <action.icon className="mb-5 h-6 w-6 text-accent" strokeWidth={1.5} />
                        <h3 className="mb-3 font-display text-4xl leading-none">{action.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{action.body}</p>
                        <p className="mt-6 text-sm font-medium">{action.cta}</p>
                      </div>
                    </SpotlightCard>
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGroup>

          {stats && (
            <Reveal className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border">
              <div className="bg-background p-7">
                <div className="font-display text-6xl leading-none"><CountUp value={stats.totalListings} /></div>
                <p className="mt-3 text-sm text-muted-foreground">Listings on GPUDealer</p>
              </div>
              <div className="bg-background p-7">
                <div className="font-display text-6xl leading-none"><CountUp value={stats.totalRequests} /></div>
                <p className="mt-3 text-sm text-muted-foreground">Open hardware requests</p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Latest listings */}
      <section className="border-t border-border bg-secondary/40 py-24 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between gap-6">
            <Reveal>
              <SectionEyebrow>Fresh inventory</SectionEyebrow>
              <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-6xl">Latest listings</h2>
            </Reveal>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/gpus">
                View all hardware
                <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          {featured === null ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : featured.length > 0 ? (
            <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
              {featured.map((listing) => (
                <RevealItem key={listing.id}>
                  <ListingCard listing={listing} />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
              <p className="font-display text-3xl">No listings yet.</p>
              <p className="mt-2 text-muted-foreground">Be the first — or tell us what you&apos;re looking for.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild variant="outline"><Link href="/sell">Sell hardware</Link></Button>
                <Button asChild variant="accent"><Link href="/request">Request hardware</Link></Button>
              </div>
            </div>
          )}

          <Button asChild variant="outline" className="mt-8 w-full sm:hidden">
            <Link href="/gpus">View all hardware</Link>
          </Button>
        </div>
      </section>

      {/* Shop by VRAM */}
      <section data-nav="dark" className="dark relative overflow-hidden bg-background py-24 text-foreground md:py-32">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_50%_70%_at_50%_0%,black,transparent)]" />
        <div className="bg-noise pointer-events-none absolute inset-0" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-14 max-w-2xl">
            <SectionEyebrow>Shop by memory</SectionEyebrow>
            <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl">
              Start with the VRAM <em className="text-accent">your model needs.</em>
            </h2>
          </Reveal>

          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VRAM_TIERS.map((tier) => (
              <RevealItem key={tier.gb}>
                <Link href={`/gpus?category=gpu&minVramGb=${tier.gb}`} className="block">
                  <SpotlightCard className="rounded-3xl border border-white/[0.08] bg-card/60 p-7 transition-colors duration-500 hover:border-white/20">
                    <div className="relative flex items-baseline gap-1">
                      <span className="font-display text-8xl leading-none tracking-[-0.03em]">{tier.gb}</span>
                      <span className="font-mono text-sm text-muted-foreground">GB{tier.plus ? "+" : ""}</span>
                    </div>
                    <div className="relative mt-10 flex items-end justify-between gap-4">
                      <p className="font-mono text-xs leading-relaxed text-muted-foreground">{tier.models}</p>
                      <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all duration-500 group-hover/spot:-translate-y-1 group-hover/spot:translate-x-1 group-hover/spot:text-accent" />
                    </div>
                  </SpotlightCard>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Provenance / trust */}
      <section className="bg-background py-24 md:py-32">
        <div className="container mx-auto grid gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <Reveal className="lg:col-span-5">
            <SectionEyebrow>Provenance</SectionEyebrow>
            <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-6xl">
              Always know where a listing came from.
            </h2>
            <p className="mt-6 max-w-md text-muted-foreground">
              Hardware is expensive. Every listing on GPUDealer is labelled with its source, and we never call
              something verified unless it is.
            </p>
          </Reveal>

          <RevealGroup className="divide-y divide-border border-y border-border lg:col-span-7">
            {[
              { icon: ExternalLink, title: "Aggregated", body: "Curated from marketplaces like eBay and Reddit. We show normalized specs and link you to the original listing." },
              { icon: UserRound, title: "Seller-submitted", body: "Listed directly on GPUDealer by a registered seller. Contact them through the listing page." },
              { icon: BadgeCheck, title: "GPUDealer Verified", body: "Hardware we've checked ourselves. Coming later — and clearly marked when it arrives." },
            ].map((item) => (
              <RevealItem key={item.title} className="group flex gap-6 py-7">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border transition-colors duration-500 group-hover:border-accent/40 group-hover:bg-accent/[0.06]">
                  <item.icon className="h-5 w-5 text-foreground/70 transition-colors group-hover:text-accent" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-display text-3xl leading-none">{item.title}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Request CTA */}
      <section data-nav="dark" className="dark relative overflow-hidden bg-background py-28 text-foreground md:py-36">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(357_90%_50%/0.25),hsl(25_95%_55%/0.08)_55%,transparent)] blur-2xl" />
        <div className="bg-noise pointer-events-none absolute inset-0" />
        <div className="container relative mx-auto grid items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <SectionEyebrow>Request hardware</SectionEyebrow>
            <h2 className="font-display text-6xl leading-[0.92] tracking-[-0.02em] md:text-8xl">
              Can&apos;t find it? <em className="bg-linear-to-r from-[#ff3b4e] via-[#ff6a3d] to-[#ffae4a] bg-clip-text pr-[0.06em] text-transparent">Request it.</em>
            </h2>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Tell us the model, quantity, budget and where it needs to go. We&apos;ll search our supply network and come back to you.
            </p>
            <Button asChild size="lg" variant="accent" className="mt-10">
              <Link href="/request">
                Submit a hardware request
                <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
          </Reveal>

          {/* Illustrative example of a request — what a good one looks like */}
          <Reveal delay={0.15} y={40}>
            <div className="rotate-[1.5deg] rounded-3xl border border-white/10 bg-card/70 p-7 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-transform duration-700 hover:rotate-0">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Example request</span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs text-emerald-400">Open</span>
              </div>
              <p className="font-display text-4xl leading-tight">32 × RTX 4090</p>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 font-mono text-sm">
                {[
                  ["Budget", "< $1,300 / unit"],
                  ["Condition", "Used OK"],
                  ["Destination", "Bangalore, IN"],
                  ["Needed", "Within 30 days"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{k}</dt>
                    <dd className="mt-1 text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
