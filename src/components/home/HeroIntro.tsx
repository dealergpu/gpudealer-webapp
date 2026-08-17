'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, HardDrive, Cpu, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const quickFilters = [
  "RTX 3090", "RTX 4090", "H100", "A100", "A6000", "24GB+", "48GB+", "80GB+"
];

export function HeroIntro() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/gpus?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/gpus`);
    }
  };

  return (
    <>
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
    </>
  );
}
