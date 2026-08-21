'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, HardDrive, Cpu, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const GpuHeroScene = dynamic(
  () => import("./GpuHeroScene").then((mod) => mod.GpuHeroScene),
  { ssr: false }
);

const quickFilters = [
  "RTX 3090", "RTX 4090", "H100", "A100", "A6000", "24GB+", "48GB+", "80GB+"
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

export function HeroIntro() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const isDesktop = useIsDesktop();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/gpus?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/gpus`);
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_30%_20%,black,transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/15 via-background to-background" />

      {isDesktop && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] md:block">
          <div className="h-full w-full opacity-90">
            <GpuHeroScene />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </div>
      )}

      <div className="container relative z-10 mx-auto flex flex-col px-4 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="mb-6 border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-accent">
            <Activity className="mr-2 inline h-3 w-3" />
            Live Marketplace
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 max-w-3xl font-heading text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl"
        >
          Find. Sell. Request.
          <br />
          <span className="text-accent">AI Compute Hardware.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10 max-w-xl text-lg text-muted-foreground md:text-xl"
        >
          Buy, sell, and source high-end GPUs, server racks, and memory for data centers and AI engineering. Verified listings, professional buyers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 w-full max-w-2xl"
        >
          <form onSubmit={handleSearch} className="relative flex gap-2">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search models, VRAM, or manufacturers (e.g., 'H100 80GB')"
              className="h-14 border-border bg-card pl-12 text-base font-medium shadow-sm focus-visible:ring-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" size="lg" className="h-14 px-8 font-bold">
              Search
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trending:</span>
            {quickFilters.map((filter) => (
              <Link key={filter} href={`/gpus?q=${encodeURIComponent(filter)}`}>
                <Badge variant="secondary" className="cursor-pointer font-mono text-[10px] transition-colors hover:bg-accent/20 hover:text-accent">
                  {filter}
                </Badge>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-3"
        >
          <Link href="/gpus" className="w-full">
            <Button variant="outline" className="group h-16 w-full justify-start text-base font-semibold">
              <HardDrive className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-accent" />
              Find Hardware
            </Button>
          </Link>
          <Link href="/sell" className="w-full">
            <Button variant="outline" className="group h-16 w-full justify-start text-base font-semibold">
              <Cpu className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-accent" />
              Sell Your Hardware
            </Button>
          </Link>
          <Link href="/request" className="w-full">
            <Button variant="outline" className="group h-16 w-full justify-start text-base font-semibold">
              <Search className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-accent" />
              Request Hardware
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
