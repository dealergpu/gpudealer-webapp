import Link from "next/link";
import {
  ComputeBillingMode,
  ComputePricingUnit,
  getComputePricing,
  type ComputePriceRow,
  type ComputePriceRowsResponse,
  type GetComputePricingSortBy,
} from "@/lib/api";
import {
  BILLING_MODE_LABELS,
  GPU_PAGES,
  UNIT_LABELS,
  formatPriceAmount,
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

const SORTS: Record<GetComputePricingSortBy, string> = {
  price_asc: "Lowest price",
  price_desc: "Highest price",
  newest: "Recently checked",
};

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
  const sort = (sortParam && sortParam in SORTS ? sortParam : "price_asc") as GetComputePricingSortBy;
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

async function loadPrices(filters: Filters): Promise<ComputePriceRowsResponse | null> {
  try {
    return await getComputePricing({
      unit: filters.unit,
      gpuModel: filters.gpuModel,
      region: filters.region,
      billingMode: filters.billing === ANY ? undefined : (filters.billing as ComputeBillingMode),
      sortBy: filters.sort,
      page: filters.page,
      limit: PAGE_SIZE,
    });
  } catch {
    return null;
  }
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

function PriceCell({ row, className }: { row: ComputePriceRow; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p className="whitespace-nowrap">
        <span className="font-mono text-base font-semibold tabular-nums">{formatPriceAmount(row)}</span>{" "}
        <span className="text-xs text-muted-foreground">{UNIT_LABELS[row.unit]}</span>
      </p>
      <PriceTags price={row} />
      {row.notes && <p className="max-w-56 text-xs text-muted-foreground">{row.notes}</p>}
    </div>
  );
}

function SourceLink({ row }: { row: ComputePriceRow }) {
  if (!row.sourceUrl) return null;
  return (
    <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
      Source
    </a>
  );
}

function PriceTable({ rows, source }: { rows: ComputePriceRow[]; source: string }) {
  return (
    <>
      {/* Desktop: a dense table. */}
      <div className="hidden overflow-hidden rounded-3xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Provider</th>
              <th scope="col" className="px-4 py-3 font-medium">GPU</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Price</th>
              <th scope="col" className="px-4 py-3 font-medium">Pricing status</th>
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-4 py-4"><ProviderCell row={row} /></td>
                <td className="px-4 py-4 whitespace-nowrap">{gpuSpec(row) || "—"}</td>
                <td className="px-4 py-4"><PriceCell row={row} className="items-end text-right" /></td>
                <td className="px-4 py-4">
                  <PricingStatus price={row} />
                  <SourceLink row={row} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col items-end gap-3">
                    <ProviderCTA provider={row.offering.provider} offeringId={row.offering.id} source={source} label="Visit" />
                    <CompareToggle item={compareItem(row)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per price, CTA always in view. */}
      <ul className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-border bg-card p-4">
            <ProviderCell row={row} />
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">GPU</p>
                <p className="text-sm">{gpuSpec(row) || "—"}</p>
              </div>
              <PriceCell row={row} className="items-end text-right" />
            </div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <PricingStatus price={row} />
                <SourceLink row={row} />
              </div>
              <CompareToggle item={compareItem(row)} />
            </div>
            <ProviderCTA provider={row.offering.provider} offeringId={row.offering.id} source={source} className="mt-4 w-full" />
          </li>
        ))}
      </ul>
    </>
  );
}

function calculatorOptions(rows: ComputePriceRow[]): GpuPriceOption[] {
  return rows
    .filter((row) => row.amount != null)
    .map((row) => ({
      id: row.id,
      label: `${row.offering.provider.name} · ${row.offering.name}${row.billingMode !== ComputeBillingMode.ON_DEMAND ? ` (${BILLING_MODE_LABELS[row.billingMode]})` : ""}`,
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
  const [result, quoteOnly] = await Promise.all([
    loadPrices(filters),
    filters.page === 1 ? loadQuoteOnly(filters) : Promise.resolve([]),
  ]);

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
      label: "Price per",
      defaultValue: "gpu",
      options: [
        { value: "gpu", label: "GPU-hour" },
        { value: "instance", label: "Instance-hour" },
      ],
    },
    ...(gpu ? [] : [{ kind: "text", name: "gpu", label: "GPU model", placeholder: "e.g. H100", maxLength: 100 } satisfies FilterField]),
    { kind: "text", name: "region", label: "Region", placeholder: "e.g. US, EU", maxLength: 50 },
    {
      kind: "select",
      name: "billing",
      label: "Billing",
      defaultValue: ComputeBillingMode.ON_DEMAND,
      options: [
        ...Object.entries(BILLING_MODE_LABELS).map(([value, label]) => ({ value, label })),
        { value: ANY, label: "Any billing" },
      ],
    },
    {
      kind: "select",
      name: "sort",
      label: "Sort by",
      defaultValue: "price_asc",
      options: Object.entries(SORTS).map(([value, label]) => ({ value, label })),
    },
  ];

  const total = result?.pagination.total;
  const source = gpu ? `gpu-cloud-${gpu.slug}` : "gpu-cloud-table";
  const options = result ? calculatorOptions(result.data) : [];

  return (
    <div className="container mx-auto space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <ComputeFilters basePath={basePath} fields={fields} values={urlValues} />

      <section aria-label="GPU cloud prices" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {total != null ? (
              <>
                <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString("en-US")}</span>{" "}
                {total === 1 ? "price" : "prices"},{" "}
                {filters.unit === ComputePricingUnit.GPU_HOUR ? "per GPU per hour" : "per whole instance per hour"}
              </>
            ) : (
              "GPU cloud prices"
            )}
          </p>
          <AffiliateDisclosure className="max-w-xl" />
        </div>

        {result === null ? (
          <ComputeError what="GPU prices" retryHref={pageHref(filters.page)} />
        ) : result.data.length > 0 ? (
          <>
            <PriceTable rows={result.data} source={source} />
            <Pager page={filters.page} totalPages={result.pagination.totalPages} href={pageHref} />
          </>
        ) : (
          <ComputeEmpty
            title={
              filters.unit === ComputePricingUnit.GPU_HOUR
                ? "No matching per-GPU prices. Try per instance-hour or any billing."
                : "No matching per-instance prices. Try per GPU-hour or any billing."
            }
            clearHref={basePath}
            requestHref={gpu ? `/compute/request?gpu=${encodeURIComponent(gpu.label)}` : "/compute/request"}
          />
        )}
      </section>

      {quoteOnly.length > 0 && (
        <section aria-labelledby="quote-only" className="space-y-3">
          <h2 id="quote-only" className="text-lg font-semibold">Quote-only capacity</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Reserved clusters and dedicated capacity without a public rate. Contact the provider for pricing — these are never
            ranked against listed prices.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quoteOnly.map((row) => (
              <li key={row.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
                <ProviderCell row={row} />
                <p className="text-sm">{gpuSpec(row) || "—"}</p>
                <PriceTags price={row} />
                <p className="text-sm font-medium">Contact for pricing</p>
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
          <h2 id="reading-prices">How to read these prices</h2>
          <ul>
            <li>
              <strong>Per GPU-hour</strong> prices are for one GPU. <strong>Per instance-hour</strong> prices cover a whole
              machine, which may hold several GPUs — the two are listed separately and never ranked together. To compare them
              per GPU, pick offerings and use <em>Compare</em>.
            </li>
            <li>
              <strong>Spot</strong> capacity is cheaper but can be interrupted. <strong>Reserved</strong> prices usually need a
              commitment, shown next to the price.
            </li>
            <li>
              Every price shows when it was last checked. <em>Verified</em> means GPUDealer checked it against the provider&apos;s
              site; prices older than 30 days are marked as possibly outdated. Always confirm on the provider&apos;s site.
            </li>
            <li>Rates usually exclude storage, network egress and taxes.</li>
          </ul>
          <h3>GPU pricing by model</h3>
          <p className="not-prose flex flex-wrap gap-2">
            {GPU_PAGES.filter((page) => page.slug !== gpu?.slug).map((page) => (
              <Link
                key={page.slug}
                href={`/compute/gpu-cloud/${page.slug}`}
                className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-foreground/30"
              >
                {page.label} cloud pricing
              </Link>
            ))}
          </p>
        </section>
        <GpuCostCalculator options={options} />
      </div>
    </div>
  );
}
