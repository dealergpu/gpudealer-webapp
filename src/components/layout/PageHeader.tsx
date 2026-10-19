import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

// Dark masthead band that opens interior pages, so every route alternates
// a dark header with light working content below it.
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  aside,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Optional visual shown beside the title on large screens. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header data-nav="dark" className={cn("dark relative overflow-hidden bg-background text-foreground", className)}>
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_100%_at_20%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-1/2 right-[-10%] h-[160%] w-[55%] rounded-full bg-[radial-gradient(closest-side,hsl(357_90%_50%/0.22),hsl(25_95%_55%/0.06)_60%,transparent)] blur-2xl" />
      <div className="bg-noise pointer-events-none absolute inset-0" />

      <div
        className={cn(
          "container relative mx-auto px-4 pt-32 pb-12 sm:px-6 md:pt-36 md:pb-16 lg:px-8",
          aside && "grid items-end gap-10 lg:grid-cols-[1fr_auto]",
        )}
      >
        <div>
          <Reveal>
            {eyebrow && (
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
            )}
            <h1 className="max-w-3xl font-display text-5xl leading-[0.95] tracking-[-0.02em] text-balance md:text-7xl">{title}</h1>
            {description && <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">{description}</p>}
          </Reveal>
          {children && <Reveal delay={0.1} className="mt-8">{children}</Reveal>}
        </div>
        {aside && <Reveal delay={0.15}>{aside}</Reveal>}
      </div>
    </header>
  );
}
