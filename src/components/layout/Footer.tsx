import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const columns = [
  {
    title: "Find",
    links: [
      { href: "/gpus?category=GPU", label: "GPUs" },
      { href: "/gpus?category=SERVER", label: "GPU servers" },
      { href: "/gpus?category=MEMORY", label: "Memory" },
      { href: "/gpus", label: "All hardware" },
    ],
  },
  {
    title: "Sell & Request",
    links: [
      { href: "/sell", label: "Sell your hardware" },
      { href: "/request", label: "Request hardware" },
      { href: "/dashboard", label: "Manage listings" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Create account" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];

export function Footer() {
  return (
    <footer data-nav="dark" className="dark relative mt-auto overflow-hidden bg-background text-foreground">
      <div className="bg-noise pointer-events-none absolute inset-0" />
      <div className="container relative mx-auto px-4 pt-20 pb-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <img src="/gpu-dealer-logo-white.svg" alt="GPUDealer" className="mb-6 h-7 w-auto" />
            <p className="max-w-sm font-display text-3xl leading-tight text-foreground">
              Used GPUs, AI servers, memory and compute hardware.
            </p>
            <Link
              href="/request"
              className="group mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Can&apos;t find it? Tell us what you need
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {columns.map((column, i) => (
            <div key={column.title} className={i === 0 ? "md:col-span-2 md:col-start-7" : "md:col-span-2"}>
              <h4 className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{column.title}</h4>
              <ul className="space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-foreground/80 transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Oversized wordmark — sits behind the legal row like a watermark */}
        <p
          aria-hidden="true"
          className="pointer-events-none mt-16 select-none bg-linear-to-b from-foreground/[0.14] to-transparent bg-clip-text text-center font-display text-[clamp(4rem,17vw,15rem)] leading-[0.8] tracking-[-0.03em] text-transparent"
        >
          GPUDealer
        </p>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} GPUDealer. All rights reserved.</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Find. Sell. Request.</p>
        </div>
      </div>
    </footer>
  );
}
