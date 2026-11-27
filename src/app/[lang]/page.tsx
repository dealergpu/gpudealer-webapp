import { Link } from "@/i18n/navigation";
import { alternatesFor, getI18n } from "@/i18n/server";
import type { Messages } from "@/i18n/messages";
import { Suspense } from "react";
import { ArrowRight, ArrowUpRight, BadgeCheck, ExternalLink, Search, Tag, UserRound, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { HeroIntro } from "@/components/home/HeroIntro";
import { ComputeHighlights } from "@/components/home/ComputeHighlights";
import { CountUp, Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { ContactForm } from "@/components/contact/ContactForm";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { HTML_LANG } from "@/i18n/config";
import type { Metadata } from "next";
import { getListings, getMarketplaceStats, ListingSortBy, type MarketplaceStats } from "@/lib/api";

// Render per request. `revalidate` (ISR) needs an OpenNext incremental cache
// (R2/KV) on Cloudflare, which isn't configured — without it the page stays
// frozen at whatever the API returned during the build.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: await alternatesFor("/") };
}

const structuredData = (t: Messages, locale: keyof typeof HTML_LANG, homeUrl: string) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/gpu-dealer-logo.png`,
      description: t.meta.description,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: homeUrl,
      description: t.meta.description,
      inLanguage: HTML_LANG[locale],
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${homeUrl}/gpus?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
});

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

const LATEST_LISTINGS_LIMIT = 12;
const LISTING_GRID = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4";

// A failing stats endpoint (e.g. not deployed yet) just hides the stats rows.
async function loadStats(): Promise<MarketplaceStats | null> {
  try {
    return await getMarketplaceStats();
  } catch {
    return null;
  }
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{children}</p>;
}

async function LatestListingsShell({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <section className="border-t border-border bg-secondary/40 py-24 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between gap-6">
          <Reveal>
            <SectionEyebrow>{t.home.freshInventory}</SectionEyebrow>
            <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-6xl">{t.home.latestListings}</h2>
          </Reveal>
          {/* "View all" goes to the unfiltered browse page — photo-less listings included. */}
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/gpus">
              {t.home.viewAll}
              <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        {children}

        <Button asChild variant="outline" className="mt-8 w-full sm:hidden">
          <Link href="/gpus">{t.home.viewAll}</Link>
        </Button>
      </div>
    </section>
  );
}

function LatestListingsSkeleton() {
  return (
    <LatestListingsShell>
      <div className={LISTING_GRID}>
        {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
      </div>
    </LatestListingsShell>
  );
}

// The home page only showcases listings with photos. Filtered by the API
// (`hasImages`), never client-side, so counts and pagination stay correct.
// Browse (/gpus) and My Listings deliberately leave the filter off.
async function LatestListings() {
  let listings;
  try {
    const response = await getListings({ hasImages: true, sortBy: ListingSortBy.newest, limit: LATEST_LISTINGS_LIMIT });
    listings = response.data;
  } catch {
    // Never break the home page over one section.
    return null;
  }
  if (listings.length === 0) return null;

  return (
    <LatestListingsShell>
      <RevealGroup className={LISTING_GRID} stagger={0.06}>
        {listings.map((listing) => (
          <RevealItem key={listing.id}>
            <ListingCard listing={listing} />
          </RevealItem>
        ))}
      </RevealGroup>
    </LatestListingsShell>
  );
}

export default async function Home() {
  const [stats, { t, locale }] = await Promise.all([loadStats(), getI18n()]);
  const h = t.home;
  const homeUrl = locale === "en" ? SITE_URL : `${SITE_URL}/${locale}`;
  const actions = [
    { n: "01", href: "/gpus", icon: Search, title: h.findTitle, body: h.findBody, cta: h.findCta },
    { n: "02", href: "/sell", icon: Tag, title: h.sellTitle, body: h.sellBody, cta: h.sellCta },
    { n: "03", href: "/request", icon: Inbox, title: h.requestTitle, body: h.requestBody, cta: h.requestCta },
  ];
  const models = stats?.popularModels?.length
    ? [...new Set([...stats.popularModels.map((m) => m.model), ...DEFAULT_MODELS])].slice(0, 14)
    : DEFAULT_MODELS;

  return (
    <div className="flex w-full flex-col">
      <JsonLd data={structuredData(t, locale, homeUrl)} />
      <HeroIntro />

      {/* Popular searches rail */}
      <section data-nav="dark" aria-label={h.popularSearches} className="dark border-t border-white/[0.06] bg-background py-6 text-foreground">
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
              <SectionEyebrow>{h.howItWorks}</SectionEyebrow>
              <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl">
                {h.threeWaysStart} <em className="text-accent">{h.threeWaysEm}</em>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="max-w-md text-lg text-muted-foreground md:justify-self-end">
                {h.threeWaysBody}
              </p>
            </Reveal>
          </div>

          <RevealGroup className="grid gap-4 md:grid-cols-3">
            {actions.map((action, i) => {
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
                <p className="mt-3 text-sm text-muted-foreground">{h.statListings}</p>
              </div>
              <div className="bg-background p-7">
                <div className="font-display text-6xl leading-none"><CountUp value={stats.totalRequests} /></div>
                <p className="mt-3 text-sm text-muted-foreground">{h.statRequests}</p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Compute price comparison */}
      <ComputeHighlights />

      {/* Latest listings */}
      <Suspense fallback={<LatestListingsSkeleton />}>
        <LatestListings />
      </Suspense>

      {/* Shop by VRAM */}
      <section data-nav="dark" className="dark relative overflow-hidden bg-background py-24 text-foreground md:py-32">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_50%_70%_at_50%_0%,black,transparent)]" />
        <div className="bg-noise pointer-events-none absolute inset-0" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-14 max-w-2xl">
            <SectionEyebrow>{h.shopByMemory}</SectionEyebrow>
            <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl">
              {h.vramTitleStart} <em className="text-accent">{h.vramTitleEm}</em>
            </h2>
          </Reveal>

          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VRAM_TIERS.map((tier) => (
              <RevealItem key={tier.gb}>
                <Link href={`/gpus?category=GPU&minVramGb=${tier.gb}`} className="block">
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
            <SectionEyebrow>{h.provenance}</SectionEyebrow>
            <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-6xl">
              {h.provenanceTitle}
            </h2>
            <p className="mt-6 max-w-md text-muted-foreground">
              {h.provenanceBody}
            </p>
          </Reveal>

          <RevealGroup className="divide-y divide-border border-y border-border lg:col-span-7">
            {[
              { icon: ExternalLink, title: h.aggregatedTitle, body: h.aggregatedBody },
              { icon: UserRound, title: h.sellerTitle, body: h.sellerBody },
              { icon: BadgeCheck, title: h.verifiedTitle, body: h.verifiedBody },
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
            <SectionEyebrow>{h.requestEyebrow}</SectionEyebrow>
            <h2 className="font-display text-6xl leading-[0.92] tracking-[-0.02em] md:text-8xl">
              {h.requestTitleStart} <em className="bg-linear-to-r from-[#ff3b4e] via-[#ff6a3d] to-[#ffae4a] bg-clip-text pr-[0.06em] text-transparent">{h.requestTitleEm}</em>
            </h2>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              {h.requestCtaBody}
            </p>
            <Button asChild size="lg" variant="accent" className="mt-10">
              <Link href="/request">
                {h.requestCtaButton}
                <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
          </Reveal>

          {/* Illustrative example of a request — what a good one looks like */}
          <Reveal delay={0.15} y={40}>
            <div className="rotate-[1.5deg] rounded-3xl border border-white/10 bg-card/70 p-7 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-transform duration-700 hover:rotate-0">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{h.exampleRequest}</span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs text-emerald-400">{h.exampleOpen}</span>
              </div>
              <p className="font-display text-4xl leading-tight">32 × RTX 4090</p>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 font-mono text-sm">
                {[
                  [h.exampleBudget, h.exampleBudgetValue],
                  [h.exampleCondition, h.exampleConditionValue],
                  [h.exampleDestination, h.exampleDestinationValue],
                  [h.exampleNeeded, h.exampleNeededValue],
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

      {/* Contact */}
      <section id="contact" aria-labelledby="contact-heading" className="scroll-mt-24 bg-background py-24 md:py-32">
        <div className="container mx-auto grid gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <Reveal className="lg:col-span-5">
            <SectionEyebrow>{h.contactEyebrow}</SectionEyebrow>
            <h2 id="contact-heading" className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-6xl">
              {h.contactTitleStart} <em className="text-accent">{h.contactTitleEm}</em>
            </h2>
            <p className="mt-6 max-w-md text-muted-foreground">
              {h.contactBody}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
