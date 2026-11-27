'use client';

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { ArrowRight } from "lucide-react";
import { useGetListings, ListingCategory, ListingSortBy } from "@/lib/api";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 24;
const GRID = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

// The page shell is static; listings are fetched in the browser so they're
// always current without a server cache (see app/page.tsx on ISR).
export function CityListings({
  cityName,
  apiCity,
  country,
}: {
  cityName: string;
  apiCity: string;
  country: string;
}) {
  const [page, setPage] = useState(1);
  const { t } = useI18n();
  const c = t.cityListings;
  const { data, isLoading, isError, isFetching, refetch } = useGetListings({
    category: ListingCategory.GPU,
    city: apiCity,
    country,
    sortBy: ListingSortBy.newest,
    limit: PAGE_SIZE,
    page,
  }, { query: { placeholderData: keepPreviousData } });

  const listings = data?.data ?? [];
  const total = data?.pagination.total;
  const totalPages = data?.pagination.totalPages ?? 1;

  const goTo = (next: number) => {
    setPage(next);
    document.getElementById("city-listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="city-listings" aria-labelledby="city-listings-heading" className="scroll-mt-24">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id="city-listings-heading" className="font-display text-4xl leading-none tracking-[-0.02em] md:text-5xl">
          {fmt(c.heading, { city: cityName })}
        </h2>
        <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
          {total != null && (
            <>
              <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString("en-US")}</span>{" "}
              {total === 1 ? t.search.listingOne : t.search.listingMany}
            </>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-12 text-center">
          <p className="font-display text-2xl">{fmt(c.loadFailed, { city: cityName })}</p>
          <Button variant="outline" className="mt-5" onClick={() => refetch()}>{t.common.tryAgain}</Button>
        </div>
      ) : listings.length > 0 ? (
        <>
          <div className={GRID} style={{ opacity: isFetching ? 0.6 : 1 }}>
            {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
          {totalPages > 1 && (
            <nav aria-label={t.search.pagination} className="mt-10 flex items-center justify-center gap-3">
              <Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => goTo(page - 1)}>{t.common.previous}</Button>
              <span className="px-2 font-mono text-xs text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages || isFetching} onClick={() => goTo(page + 1)}>{t.common.next}</Button>
            </nav>
          )}
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t.search.noMatch}</p>
          <p className="mx-auto mt-4 max-w-md font-display text-3xl leading-tight">
            {fmt(c.cantFind, { city: cityName })}
          </p>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            {t.search.cantFindBody}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild variant="accent">
              <Link href="/request">{t.search.requestHardware} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline"><Link href="/gpus?category=GPU">{c.browseAll}</Link></Button>
          </div>
        </div>
      )}
    </section>
  );
}
