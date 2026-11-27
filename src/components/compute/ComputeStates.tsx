import { Link } from "@/i18n/navigation";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function ComputeError({ what, retryHref }: { what: string; retryHref: string }) {
  const { t } = await getI18n();
  return (
    <div role="alert" className="rounded-3xl border border-border bg-card px-6 py-16 text-center">
      <p className="font-display text-3xl">{fmt(t.computeUi.loadErrorTitle, { what })}</p>
      <p className="mt-2 text-muted-foreground">{t.computeUi.loadErrorBody}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href={retryHref}>{t.common.tryAgain}</Link>
      </Button>
    </div>
  );
}

/** Empty results: the compute request form is the way forward. */
export async function ComputeEmpty({
  title,
  clearHref,
  requestHref = "/compute/request",
}: {
  title: string;
  clearHref?: string;
  requestHref?: string;
}) {
  const { t } = await getI18n();
  return (
    <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <h2 className="mx-auto mt-4 max-w-md font-display text-3xl leading-tight md:text-4xl">{t.computeUi.needSomething}</h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        {t.computeUi.needSomethingBody}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button asChild variant="accent">
          <Link href={requestHref}>
            {t.computeUi.tellUsCompute}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        {clearHref && (
          <Button asChild variant="outline">
            <Link href={clearHref}>{t.computeUi.clearFilters}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export async function Pager({ page, totalPages, href }: { page: number; totalPages: number; href: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const { t } = await getI18n();
  return (
    <nav aria-label={t.search.pagination} className="mt-8 flex items-center justify-center gap-3">
      {page > 1 && (
        <Button asChild variant="outline">
          <Link href={href(page - 1)}>{t.common.previous}</Link>
        </Button>
      )}
      <span className="px-2 font-mono text-xs text-muted-foreground">
        {page} / {totalPages}
      </span>
      {page < totalPages && (
        <Button asChild variant="outline">
          <Link href={href(page + 1)}>{t.common.next}</Link>
        </Button>
      )}
    </nav>
  );
}
