import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";

// Dark, atmospheric backdrop with a light form card floating on top — shared
// by sign-in and sign-up.
export function AuthShell({ title, description, children }: { title: ReactNode; description: string; children: ReactNode }) {
  return (
    <div data-nav="dark" className="dark relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4 pt-28 pb-16">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(357_90%_50%/0.28),hsl(25_95%_55%/0.08)_55%,transparent)] blur-2xl" />
      <div className="bg-noise pointer-events-none absolute inset-0" />

      <Reveal className="relative w-full max-w-[440px]" y={32}>
        <div className="light rounded-3xl border border-border bg-card p-8 text-foreground shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:p-10">
          <h1 className="font-display text-4xl leading-none tracking-[-0.01em]">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </Reveal>
    </div>
  );
}
