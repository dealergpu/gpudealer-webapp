import { Link } from "@/i18n/navigation";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import {
  ComputeBillingMode,
  ComputePricingUnit,
  getComputePricing,
  type ComputeProvider,
  type ComputePriceRow,
  type ComputePriceRowsResponse,
  type GetComputePricingSortBy,
} from "@/lib/api";
import {
  BILLING_MODE_LABELS,
  GPU_PAGES,
  formatPriceAmount,
  getFeaturedProviders,
  type GpuPage,
} from "@/lib/compute";
import { ComputeFilters, type FilterField } from "@/components/compute/ComputeFilters";
import { CompareToggle } from "@/components/compute/CompareSelection";
import { GpuCostCalculator, type GpuPriceOption } from "@/components/compute/CostCalculators";
import { PricingStatus, PriceTags } from "@/components/compute/PricingStatus";
import { ProviderCTA } from "@/components/compute/ProviderCTA";
import { FeaturedBadge } from "@/components/compute/FeaturedBadge";
import { ProviderLogo } from "@/components/compute/ProviderLogo";
import { AffiliateDisclosure } from "@/components/compute/AffiliateDisclosure";
import { ComputeEmpty, ComputeError, Pager } from "@/components/compute/ComputeStates";
import { cn } from "@/lib/utils";

export type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 24;
const ANY = "ANY";
const SORT_KEYS: GetComputePricingSortBy[] = ["price_asc", "price_desc", "newest"];

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

/** URL params → API filters. Anything unrecognised falls back to the default. */
function parseFilters(searchParams: SearchParams, gpu?: GpuPage) {
  const unit = first(searchParams.unit) === "instance" ? ComputePricingUnit.INSTANCE_HOUR : ComputePricingUnit.GPU_HOUR;
  const billingParam = first(searchParams.billing);
  const billing =
    billingParam === ANY || (billingParam && billingParam in BILLING_MODE_LABELS)
      ? billingParam
      : ComputeBillingMode.ON_DEMAND;
  const sortParam = first(searchParams.sort);
  const sort = (SORT_KEYS.find((key) => key === sortParam) ?? "price_asc") as GetComputePricingSortBy;
  const page = Math.max(1, Math.floor(Number(first(searchParams.page))) || 1);
  return {
    unit,
    billing,
    sort,
    page,
    gpuModel: gpu ? gpu.slug : first(searchParams.gpu)?.slice(0, 100),
    region: first(searchParams.region)?.slice(0, 50),
  };
}

type Filters = ReturnType<typeof parseFilters>;

function pricingQuery(filters: Filters) {
  return {
    unit: filters.unit,
    gpuModel: filters.gpuModel,
    region: filters.region,
    billingMode: filters.billing === ANY ? undefined : (filters.billing as ComputeBillingMode),
    sortBy: filters.sort,
  };
}

async function loadPrices(filters: Filters): Promise<ComputePriceRowsResponse | null> {
  try {
    return await getComputePricing({ ...pricingQuery(filters), page: filters.page, limit: PAGE_SIZE });
  } catch {
    return null;
  }
}

/**
 * Featured providers' prices under the same filters and sort, pinned above
 * the table on page 1 — provider by provider, A–Z. A provider whose
 * request fails is just left out.
 */
async function loadPinnedPrices(filters: Filters, featured: ComputeProvider[]): Promise<ComputePriceRow[]> {
  const perProvider = await Promise.all(
    featured.map((provider) =>
      getComputePricing({ ...pricingQuery(filters), provider: provider.slug, limit: 100 })
        .then((result) => result.data)
        .catch(() => []),
    ),
  );
  return perProvider.flat();
}

/** Quote-only GPU capacity (reserved clusters etc.): listed separately, never ranked. */
async function loadQuoteOnly(filters: Filters): Promise<ComputePriceRow[]> {
  try {
    const result = await getComputePricing({
      unit: ComputePricingUnit.CUSTOM_QUOTE,
      gpuModel: filters.gpuModel,
      region: filters.region,
      limit: 12,
    });
    return result.data.filter((row) => row.offering.gpuModel != null);
  } catch {
    return [];
  }
}

function gpuSpec(row: ComputePriceRow): string {
  const { gpuModel, gpuVramGb, gpuCount } = row.offering;
  return [gpuCount && gpuCount > 1 ? `${gpuCount}×` : null, gpuModel, gpuVramGb ? `${gpuVramGb}GB` : null]
    .filter(Boolean)
    .join(" ");
}

function compareItem(row: ComputePriceRow) {
  return { id: row.offering.id, label: `${row.offering.provider.name} · ${row.offering.name}` };
}

function ProviderCell({ row }: { row: ComputePriceRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ProviderLogo provider={row.offering.provider} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={`/compute/providers/${row.offering.provider.slug}`} className="text-sm font-medium hover:underline">
            {row.offering.provider.name}
          </Link>
          <FeaturedBadge provider={row.offering.provider} />
        </p>
        <p className="truncate text-xs text-muted-foreground">{row.offering.name}</p>
      </div>
    </div>
  );
}

function PriceCell({ row, className, t }: { row: ComputePriceRow; className?: string; t: Messages }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p className="whitespace-nowrap">
        <span className="font-mono text-base font-semibold tabular-nums">{formatPriceAmount(row, t.computeLabels.contactForPricing)}</span>{" "}
        <span className="text-xs text-muted-foreground">{t.computeLabels.units[row.unit]}</span>
      </p>
      <PriceTags price={row} />
      {row.notes && <p className="max-w-56 text-xs text-muted-foreground">{row.notes}</p>}
    </div>
  );
}

function SourceLink({ row, t }: { row: ComputePriceRow; t: Messages }) {
  if (!row.sourceUrl) return null;
  return (
    <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
      {t.gpuCloud.source}
    </a>
  );
}

function PriceRow({ row, source, t }: { row: ComputePriceRow; source: string; t: Messages }) {
  return (
    <tr className="align-top">
      <td className="px-4 py-4"><ProviderCell row={row} /></td>
      <td className="px-4 py-4 whitespace-nowrap">{gpuSpec(row) || "—"}</td>
      <td className="px-4 py-4"><PriceCell row={row} className="items-end text-right" t={t} /></td>
      <td className="px-4 py-4">
        <PricingStatus price={row} />
        <SourceLink row={row} t={t} />
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col items-end gap-3">
          <ProviderCTA provider={row.offering.provider} offeringId={row.offering.id} source={source} label={t.gpuCloud.visit} />
          <CompareToggle item={compareItem(row)} />
        </div>
      </td>
    </tr>
  );
}

function PriceCard({ row, source, t }: { row: ComputePriceRow; source: string; t: Messages }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <ProviderCell row={row} />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t.gpuCloud.gpu}</p>
          <p className="text-sm">{gpuSpec(row) || "—"}</p>
        </div>
        <PriceCell row={row} className="items-end text-right" t={t} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <PricingStatus price={row} />
          <SourceLink row={row} t={t} />
        </div>
        <CompareToggle item={compareItem(row)} />
      </div>
      <ProviderCTA provider={row.offering.provider} offeringId={row.offering.id} source={source} className="mt-4 w-full" />
    </li>
  );
}

const GROUP_HEADING = "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground";

/**
 * Price rows, optionally with featured providers' rows pinned in their own
 * labelled group above the ranked rows — so "Lowest price" still means
 * exactly that for the rows under it.
 */
function PriceTable({
  pinned,
  rows,
  rankedLabel,
  source,
  t,
}: {
  pinned: ComputePriceRow[];
  rows: ComputePriceRow[];
  rankedLabel: string;
  source: string;
  t: Messages;
}) {
  const g = t.gpuCloud;
  const groups = [
    { key: "featured", label: g.featuredGroup, rows: pinned, source: `${source}-featured` },
    { key: "ranked", label: pinned.length > 0 ? fmt(g.otherProviders, { sort: rankedLabel }) : null, rows, source },
  ].filter((group) => group.rows.length > 0);

  return (
    <>
      {/* Desktop: a dense table. */}
      <div className="hidden overflow-hidden rounded-3xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">{g.provider}</th>
              <th scope="col" className="px-4 py-3 font-medium">{g.gpu}</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">{g.price}</th>
              <th scope="col" className="px-4 py-3 font-medium">{g.pricingStatus}</th>
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">{g.actions}</span></th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.key} className="divide-y divide-border border-b border-border last:border-b-0">
              {group.label && (
                <tr className="bg-muted/20">
                  <th scope="colgroup" colSpan={5} className={cn("px-4 py-2 text-left", GROUP_HEADING)}>{group.label}</th>
                </tr>
              )}
              {group.rows.map((row) => <PriceRow key={row.id} row={row} source={group.source} t={t} />)}
            </tbody>
          ))}
        </table>
      </div>

      {/* Mobile: one card per price, CTA always in view. */}
      <div className="space-y-5 md:hidden">
        {groups.map((group) => (
          <div key={group.key} className="space-y-3">
            {group.label && <p className={GROUP_HEADING}>{group.label}</p>}
            <ul className="grid gap-3">
              {group.rows.map((row) => <PriceCard key={row.id} row={row} source={group.source} t={t} />)}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function calculatorOptions(rows: ComputePriceRow[], t: Messages): GpuPriceOption[] {
  return rows
    .filter((row) => row.amount != null)
    .map((row) => ({
      id: row.id,
      label: `${row.offering.provider.name} · ${row.offering.name}${row.billingMode !== ComputeBillingMode.ON_DEMAND ? ` (${t.computeLabels.billing[row.billingMode]})` : ""}`,
      amount: row.amount!,
      currency: row.currency,
      unit: row.unit as GpuPriceOption["unit"],
      gpuCount: row.offering.gpuCount,
    }));
}

/**
 * GPU cloud price table, shared by `/compute/gpu-cloud` and the per-model
 * pages (`gpu` fixes the model filter). Rows are prices in one unit at a
 * time — per-GPU and per-instance prices are never mixed in one ranking.
 */
export async function GpuCloudView({
  basePath,
  searchParams,
  gpu,
}: {
  basePath: string;
  searchParams: SearchParams;
  gpu?: GpuPage;
}) {
  const filters = parseFilters(searchParams, gpu);
  const { t } = await getI18n();
  const g = t.gpuCloud;
  const [result, quoteOnly, featured] = await Promise.all([
    loadPrices(filters),
    filters.page === 1 ? loadQuoteOnly(filters) : Promise.resolve([]),
    getFeaturedProviders(),
  ]);

  // Featured providers' rows are pinned on page 1 and left out of the ranked
  // rows on every page, so none appears twice. If the featured list can't be
  // loaded, nothing is pinned or removed.
  const featuredSlugs = new Set((featured ?? []).map((provider) => provider.slug));
  const pinned = featured && filters.page === 1 ? await loadPinnedPrices(filters, featured) : [];
  const rows = result?.data.filter((row) => !featuredSlugs.has(row.offering.provider.slug)) ?? [];

  // Defaults are left out, so URLs stay short and canonical-looking.
  const urlValues: Record<string, string | undefined> = {
    unit: filters.unit === ComputePricingUnit.INSTANCE_HOUR ? "instance" : undefined,
    gpu: gpu ? undefined : filters.gpuModel,
    region: filters.region,
    billing: filters.billing === ComputeBillingMode.ON_DEMAND ? undefined : filters.billing,
    sort: filters.sort === "price_asc" ? undefined : filters.sort,
  };
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(urlValues)) if (value) params.set(key, value);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const fields: FilterField[] = [
    {
      kind: "select",
      name: "unit",
      label: g.pricePer,
      defaultValue: "gpu",
      options: [
        { value: "gpu", label: g.gpuHour },
        { value: "instance", label: g.instanceHour },
      ],
    },
    ...(gpu ? [] : [{ kind: "text", name: "gpu", label: g.gpuModel, placeholder: g.gpuModelPlaceholder, maxLength: 100 } satisfies FilterField]),
    { kind: "text", name: "region", label: g.region, placeholder: g.regionPlaceholder, maxLength: 50 },
    {
      kind: "select",
      name: "billing",
      label: g.billing,
      defaultValue: ComputeBillingMode.ON_DEMAND,
      options: [
        ...Object.entries(t.computeLabels.billing).map(([value, label]) => ({ value, label })),
        { value: ANY, label: g.anyBilling },
      ],
    },
    {
      kind: "select",
      name: "sort",
      label: g.sortBy,
      defaultValue: "price_asc",
      options: Object.entries(g.sorts).map(([value, label]) => ({ value, label })),
    },
  ];

  const total = result?.pagination.total;
  const source = gpu ? `gpu-cloud-${gpu.slug}` : "gpu-cloud-table";
  const options = calculatorOptions([...pinned, ...rows], t);

  return (
    <div className="container mx-auto space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <ComputeFilters basePath={basePath} fields={fields} values={urlValues} />

      <section aria-label={g.pricesLabel} className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {total != null ? (
              <>
                <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString("en-US")}</span>{" "}
                {total === 1 ? g.priceOne : g.priceMany},{" "}
                {filters.unit === ComputePricingUnit.GPU_HOUR ? g.perGpuHour : g.perInstanceHour}
              </>
            ) : (
              g.pricesLabel
            )}
          </p>
          <AffiliateDisclosure className="max-w-xl" />
        </div>

        {result === null ? (
          <ComputeError what={g.pricesWhat} retryHref={pageHref(filters.page)} />
        ) : pinned.length + rows.length > 0 ? (
          <>
            <PriceTable pinned={pinned} rows={rows} rankedLabel={g.sorts[filters.sort]} source={source} t={t} />
            <Pager page={filters.page} totalPages={result.pagination.totalPages} href={pageHref} />
          </>
        ) : (
          <ComputeEmpty
            title={
              filters.unit === ComputePricingUnit.GPU_HOUR
                ? g.emptyGpu
                : g.emptyInstance
            }
            clearHref={basePath}
            requestHref={gpu ? `/compute/request?gpu=${encodeURIComponent(gpu.label)}` : "/compute/request"}
          />
        )}
      </section>

      {quoteOnly.length > 0 && (
        <section aria-labelledby="quote-only" className="space-y-3">
          <h2 id="quote-only" className="text-lg font-semibold">{g.quoteOnly}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {g.quoteOnlyBody}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quoteOnly.map((row) => (
              <li key={row.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
                <ProviderCell row={row} />
                <p className="text-sm">{gpuSpec(row) || "—"}</p>
                <PriceTags price={row} />
                <p className="text-sm font-medium">{t.computeLabels.contactForPricing}</p>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <CompareToggle item={compareItem(row)} />
                  <ProviderCTA provider={row.offering.provider} offeringId={row.offering.id} source={`${source}-quote`} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="reading-prices" className="prose prose-sm max-w-none dark:prose-invert">
          <h2 id="reading-prices">{g.howToRead}</h2>
          <ul>
            <li>
              <strong>{g.readPerGpuStrong}</strong> {g.readPerGpu} <strong>{g.readPerInstanceStrong}</strong> {g.readPerInstance}{" "}
              <em>{g.readCompareEm}</em>.
            </li>
            <li>
              <strong>{g.readSpotStrong}</strong> {g.readSpot} <strong>{g.readReservedStrong}</strong> {g.readReserved}
            </li>
            <li>
              {g.readCheckedStart} <em>{g.readVerifiedEm}</em> {g.readChecked}
            </li>
            <li>{g.readExcludes}</li>
          </ul>
          <h3>{g.byModel}</h3>
          <p className="not-prose flex flex-wrap gap-2">
            {GPU_PAGES.filter((page) => page.slug !== gpu?.slug).map((page) => (
              <Link
                key={page.slug}
                href={`/compute/gpu-cloud/${page.slug}`}
                className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-foreground/30"
              >
                {fmt(g.modelCloudPricing, { gpu: page.label })}
              </Link>
            ))}
          </p>
        </section>
        <GpuCostCalculator options={options} />
      </div>
    </div>
  );
}
