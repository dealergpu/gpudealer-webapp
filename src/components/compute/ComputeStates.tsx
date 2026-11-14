import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComputeError({ what, retryHref }: { what: string; retryHref: string }) {
  return (
    <div role="alert" className="rounded-3xl border border-border bg-card px-6 py-16 text-center">
      <p className="font-display text-3xl">We couldn&apos;t load {what}.</p>
      <p className="mt-2 text-muted-foreground">The comparison service is temporarily unavailable. Please try again shortly.</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href={retryHref}>Try again</Link>
      </Button>
    </div>
  );
}

/** Empty results: the compute request form is the way forward. */
export function ComputeEmpty({
  title,
  clearHref,
  requestHref = "/compute/request",
}: {
  title: string;
  clearHref?: string;
  requestHref?: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <h2 className="mx-auto mt-4 max-w-md font-display text-3xl leading-tight md:text-4xl">Need something we don&apos;t list?</h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Tell us the GPUs, models, volume and budget you&apos;re working with.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button asChild variant="accent">
          <Link href={requestHref}>
            Tell us what compute you need
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        {clearHref && (
          <Button asChild variant="outline">
            <Link href={clearHref}>Clear filters</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function Pager({ page, totalPages, href }: { page: number; totalPages: number; href: (page: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
      {page > 1 && (
        <Button asChild variant="outline">
          <Link href={href(page - 1)}>Previous</Link>
        </Button>
      )}
      <span className="px-2 font-mono text-xs text-muted-foreground">
        {page} / {totalPages}
      </span>
      {page < totalPages && (
        <Button asChild variant="outline">
          <Link href={href(page + 1)}>Next</Link>
        </Button>
      )}
    </nav>
  );
}
