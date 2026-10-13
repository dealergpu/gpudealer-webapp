'use client';

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SplitWords } from "@/components/motion/Reveal";
import { useMediaQuery } from "@/hooks/use-media-query";

const GpuHeroScene = dynamic(
  () => import("./GpuHeroScene").then((mod) => mod.GpuHeroScene),
  { ssr: false }
);

const quickFilters = ["RTX 3090", "RTX 4090", "RTX 5090", "A6000", "A100", "H100"];

const actions = [
  { href: "/gpus", label: "Find hardware" },
  { href: "/sell", label: "Sell your hardware" },
  { href: "/request", label: "Request hardware" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function HeroIntro() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const reducedMotion = useReducedMotion() ?? false;
  const section = useRef<HTMLElement>(null);

  // On desktop the hero is taller than the viewport with a sticky stage, so
  // scrolling through it pulls the GPU apart into an exploded view.
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const glow = useTransform(scrollYProgress, [0, 1], [0.55, 1]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/gpus?q=${encodeURIComponent(q)}` : "/gpus");
  };

  const fadeUp = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <section ref={section} data-nav="dark" className="dark relative bg-background text-foreground lg:h-[185vh]">
      <div className="relative overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        {/* Atmosphere: blueprint grid, warm glow behind the card, film grain */}
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_70%_60%_at_60%_40%,black,transparent)]" />
        <motion.div
          style={{ opacity: glow }}
          className="pointer-events-none absolute -right-[10%] top-[10%] h-[80%] w-[75%] rounded-full bg-[radial-gradient(closest-side,hsl(357_90%_50%/0.35),hsl(25_95%_55%/0.12)_55%,transparent)] blur-2xl"
        />
        <div className="pointer-events-none absolute -left-[10%] bottom-[-20%] h-[60%] w-[50%] rounded-full bg-[radial-gradient(closest-side,hsl(228_90%_60%/0.14),transparent)] blur-2xl" />
        <div className="bg-noise pointer-events-none absolute inset-0" />

        {isDesktop && (
          <motion.div
            className="absolute inset-y-0 right-0 w-[66%] [mask-image:linear-gradient(to_right,transparent,black_28%)]"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: EASE }}
          >
            <GpuHeroScene progress={scrollYProgress} reducedMotion={reducedMotion} />
          </motion.div>
        )}

        <motion.div
          style={isDesktop ? { y: copyY } : undefined}
          className="container relative z-10 mx-auto flex flex-col justify-center px-4 pt-32 pb-10 sm:px-6 lg:h-full lg:px-8 lg:pt-20 lg:pb-0"
        >
          <motion.div {...fadeUp(0)} className="mb-7">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              GPUDealer — the used AI hardware marketplace
            </span>
          </motion.div>

          <h1 className="mb-6 max-w-[11ch] font-display text-[clamp(3.5rem,9vw,8.5rem)] leading-[0.92] tracking-[-0.02em]">
            <SplitWords
              text="Find. Sell. Request."
              delay={0.15}
              wordClassName={(word) =>
                word === "Request."
                  ? "italic bg-linear-to-r from-[#ff3b4e] via-[#ff6a3d] to-[#ffae4a] bg-clip-text text-transparent pr-[0.06em]"
                  : undefined
              }
            />
          </h1>

          <motion.p {...fadeUp(0.5)} className="mb-10 max-w-md text-lg leading-relaxed text-muted-foreground md:text-xl">
            Used GPUs, AI servers, memory and compute hardware.
          </motion.p>

          <motion.div {...fadeUp(0.65)} className="w-full max-w-xl">
            <form
              onSubmit={handleSearch}
              role="search"
              className="group/search flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] p-1.5 pl-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors focus-within:border-white/30 focus-within:bg-white/[0.09]"
            >
              <Search className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-focus-within/search:text-foreground" aria-hidden="true" />
              <label htmlFor="hero-search" className="sr-only">Search hardware</label>
              <input
                id="hero-search"
                type="search"
                placeholder="Search GPUs, servers, memory..."
                className="h-11 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" variant="accent" className="h-11 px-6">
                Search
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Popular</span>
              {quickFilters.map((filter) => (
                <Link
                  key={filter}
                  href={`/gpus?q=${encodeURIComponent(filter)}`}
                  className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-white/30 hover:text-foreground"
                >
                  {filter}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.nav {...fadeUp(0.8)} aria-label="Primary actions" className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground/85 transition-colors hover:text-foreground"
              >
                <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                  {action.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            ))}
          </motion.nav>
        </motion.div>

        {!isDesktop && (
          <div className="relative h-[300px] w-full sm:h-[380px] lg:hidden">
            <GpuHeroScene reducedMotion={reducedMotion} showLabels={false} postprocessing={false} />
          </div>
        )}

        {isDesktop && !reducedMotion && (
          <motion.div
            style={{ opacity: hintOpacity }}
            className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Scroll to inspect
            <span className="relative h-10 w-px overflow-hidden bg-white/10">
              <motion.span
                className="absolute inset-x-0 top-0 h-1/2 bg-foreground/70"
                animate={{ y: ["-100%", "200%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
