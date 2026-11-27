'use client';

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import { keepPreviousData } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { ListingStatus, useGetSavedListings } from "@/lib/api";
import { useSavedListingIds } from "@/lib/saved-listings";
import { ListingCard, ListingCardSkeleton } from "@/components/ListingCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 24;

export function SavedListingsClient() {
  const [page, setPage] = useState(1);
  const { t } = useI18n();
  const s = t.savedPage;
  const { data, isLoading, isError, isFetching, refetch } = useGetSavedListings(
    { page, limit: PAGE_SIZE },
    { query: { placeholderData: keepPreviousData } },
  );
  const savedIds = useSavedListingIds();

  // Unsaving the last card on the last page empties it once the list
  // refetches — step back to the new last page.
  const totalPages = data?.pagination.totalPages ?? 1;
  if (page > totalPages) setPage(totalPages);

  // Hide cards the moment they're unsaved (the ids update optimistically),
  // rather than waiting for the list to refetch.
  const visible = (data?.data ?? []).filter(
    (saved) => saved.listing && (!savedIds || savedIds.has(saved.listingId)),
  );

  const goTo = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <PageHeader
        eyebrow={s.eyebrow}
        title={<>{s.titleStart} <em>{s.titleEm}</em></>}
        description={s.description}
      />

      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : isError || !data ? (
          <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center">
            <p className="font-display text-3xl">{s.loadFailed}</p>
            <p className="mt-2 text-muted-foreground">{s.pleaseTryAgain}</p>
            <Button variant="outline" className="mt-6" onClick={() => refetch()}>{t.common.tryAgain}</Button>
          </div>
        ) : data.pagination.total === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-16 text-center">
            <Bookmark className="mb-4 h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="font-display text-3xl">{s.emptyTitle}</p>
            <p className="mt-2 max-w-md text-muted-foreground">
              {s.emptyBody}
            </p>
            <Button asChild variant="accent" className="mt-6">
              <Link href="/gpus">{s.browse}</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{data.pagination.total.toLocaleString("en-US")}</span>{" "}
              {data.pagination.total === 1 ? s.countOne : s.countMany}
            </p>

            {visible.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((saved) => (
                  <ListingCard
                    key={saved.id}
                    listing={saved.listing!}
                    unavailable={saved.listing!.status !== ListingStatus.PUBLISHED}
                  />
                ))}
              </div>
            ) : (
              // Everything on this page was just unsaved; the refetch is on its way.
              <p className="py-16 text-center text-sm text-muted-foreground">{s.updating}</p>
            )}

            {totalPages > 1 && (
              <nav aria-label={t.search.pagination} className="mt-12 flex items-center justify-center gap-3">
                <Button variant="outline" onClick={() => goTo(page - 1)} disabled={page <= 1 || isFetching}>
                  {t.common.previous}
                </Button>
                <span className="px-2 font-mono text-xs text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" onClick={() => goTo(page + 1)} disabled={page >= totalPages || isFetching}>
                  {t.common.next}
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
