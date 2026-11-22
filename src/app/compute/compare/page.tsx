import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  ComputeBillingMode,
  ComputePricingUnit,
  compareComputeOfferings,
  type ComputeComparison,
  type ComputeComparisonGroup,
  type ComputeOffering,
} from "@/lib/api";
import {
  BILLING_MODE_LABELS,
  OFFERING_TYPE_LABELS,
  UNIT_LABELS,
  UNIT_TITLES,
  formatContextLength,
  formatMoney,
  pickPrice,
} from "@/lib/compute";
import { PricingStatus } from "@/components/compute/PricingStatus";
import { ProviderCTA } from "@/components/compute/ProviderCTA";
import { FeaturedBadge } from "@/components/compute/FeaturedBadge";
import { ProviderLogo } from "@/components/compute/ProviderLogo";
import { AffiliateDisclosure } from "@/components/compute/AffiliateDisclosure";
import { CAPABILITIES, yesNo } from "@/components/compute/Capabilities";
import {
  GpuCostCalculator,
  InferenceCostCalculator,
  type GpuPriceOption,
  type InferencePriceOption,
} from "@/components/compute/CostCalculators";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Compare Compute Offerings",
  description: "Side-by-side comparison of GPU cloud and inference offerings, ranked only against prices in the same unit.",
  // Arbitrary selections aren't useful search results.
  robots: { index: false, follow: true },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 10;

type Loaded = { comparison: ComputeComparison } | { error: "none" | "too-many" | "not-found" | "failed" };

async function loadComparison(raw: string | undefined): Promise<Loaded> {
  const ids = [...new Set((raw ?? "").split(",").map((id) => id.trim()).filter((id) => UUID.test(id)))];
  if (ids.length === 0) return { error: "none" };
  if (ids.length > MAX) return { error: "too-many" };
  try {
    const response = await compareComputeOfferings({ offeringIds: ids.join(",") });
    return { comparison: response.data };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { error: "not-found" };
    if (error instanceof ApiError && error.status === 400) return { error: "none" };
    return { error: "failed" };
  }
}

const ERROR_COPY = {
  none: ["Nothing to compare yet.", "Pick offerings with the Compare checkbox on the GPU cloud or inference pages."],
  "too-many": [`You can compare up to ${MAX} offerings.`, "Remove a few from your selection and try again."],
  "not-found": [
    "One or more of these offerings is no longer listed.",
    "It may have been retired by the provider. Remove it from your selection and compare again.",
  ],
  failed: ["We couldn't load this comparison.", "The comparison service is temporarily unavailable. Please try again shortly."],
} as const;

function groupTitle(group: ComputeComparisonGroup): string {
  const billing = group.billingMode === ComputeBillingMode.ON_DEMAND ? null : BILLING_MODE_LABELS[group.billingMode];
  return [UNIT_TITLES[group.unit], billing, group.currency].filter(Boolean).join(" · ");
}

function PriceGroup({ group, offerings }: { group: ComputeComparisonGroup; offerings: Map<string, ComputeOffering> }) {
  const ranked = group.offeringCount > 1;
  return (
    <section aria-label={groupTitle(group)} className="rounded-3xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{groupTitle(group)}</h3>
      {!ranked && <p className="mt-1 text-xs text-muted-foreground">Only one offering has a price in this unit — nothing to rank it against.</p>}
      <ol className="mt-4 divide-y divide-border">
        {group.entries.map((entry, index) => {
          const offering = offerings.get(entry.offeringId);
          if (!offering) return null;
          return (
            <li key={entry.pricingId} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 py-3">
              <div className="flex min-w-0 items-start gap-3">
                {ranked && <span className="w-5 pt-2 font-mono text-xs text-muted-foreground">{index + 1}</span>}
                <ProviderLogo provider={offering.provider} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {offering.provider.name}
                    <FeaturedBadge provider={offering.provider} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {offering.name}
                    {entry.region && <> · {entry.region}</>}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="text-right">
                  <p className="whitespace-nowrap">
                    <span className="font-mono text-base font-semibold tabular-nums">{formatMoney(entry.comparableAmount, group.currency)}</span>{" "}
                    <span className="text-xs text-muted-foreground">{UNIT_LABELS[group.unit]}</span>
                  </p>
                  {entry.isDerived && (
                    <p className="text-xs text-muted-foreground">
                      derived from {formatMoney(entry.amount, group.currency)} {UNIT_LABELS[entry.unit]}
                      {offering.gpuCount ? `, ${offering.gpuCount} GPUs` : ""}
                    </p>
                  )}
                </div>
                <PricingStatus price={entry} className="w-32" />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

type SpecRow = { label: string; value: (o: ComputeOffering) => string | null };

const SPEC_ROWS: SpecRow[] = [
  { label: "Type", value: (o) => OFFERING_TYPE_LABELS[o.offeringType] },
  { label: "GPU", value: (o) => o.gpuModel },
  { label: "VRAM per GPU", value: (o) => (o.gpuVramGb ? `${o.gpuVramGb} GB` : null) },
  { label: "GPU count", value: (o) => (o.gpuCount ? String(o.gpuCount) : null) },
  { label: "Architecture", value: (o) => o.gpuArchitecture },
  { label: "CPU", value: (o) => o.cpuDescription },
  { label: "RAM", value: (o) => (o.ramGb ? `${o.ramGb} GB` : null) },
  { label: "Storage", value: (o) => o.storageDescription },
  { label: "Model", value: (o) => o.modelName },
  { label: "Model by", value: (o) => o.modelProvider },
  { label: "Context length", value: (o) => (o.contextLength ? formatContextLength(o.contextLength) : null) },
  ...CAPABILITIES.map(({ key, label }) => ({
    label,
    value: (o: ComputeOffering) => (o.modelName ? yesNo(o[key]) : null),
  })),
  { label: "Regions", value: (o) => (o.regions.length ? o.regions.join(", ") : null) },
];

function gpuOptions(offerings: ComputeOffering[]): GpuPriceOption[] {
  return offerings.flatMap((o) =>
    [ComputePricingUnit.GPU_HOUR, ComputePricingUnit.INSTANCE_HOUR].flatMap((unit) => {
      const price = pickPrice(o.pricing, unit);
      return price?.amount != null
        ? [{ id: price.id, label: `${o.provider.name} · ${o.name}`, amount: price.amount, currency: price.currency, unit, gpuCount: o.gpuCount }]
        : [];
    }),
  );
}

function inferenceOptions(offerings: ComputeOffering[]): InferencePriceOption[] {
  return offerings.flatMap((o) => {
    const input = pickPrice(o.pricing, ComputePricingUnit.INPUT_MILLION_TOKENS);
    const output = pickPrice(o.pricing, ComputePricingUnit.OUTPUT_MILLION_TOKENS);
    return input?.amount != null && output?.amount != null && input.currency === output.currency
      ? [{ id: o.id, label: `${o.provider.name} · ${o.name}`, inputAmount: input.amount, outputAmount: output.amount, currency: input.currency }]
      : [];
  });
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const loaded = await loadComparison(Array.isArray(params.ids) ? params.ids[0] : params.ids);

  if ("error" in loaded) {
    const [title, body] = ERROR_COPY[loaded.error];
    return (
      <>
        <PageHeader eyebrow="Compare" title={<>Compare <em>compute</em></>} />
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div role={loaded.error === "none" ? undefined : "alert"} className="rounded-3xl border border-border bg-card px-6 py-14 text-center">
            <p className="font-display text-3xl">{title}</p>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">{body}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline"><Link href="/compute/gpu-cloud">GPU cloud prices</Link></Button>
              <Button asChild variant="outline"><Link href="/compute/inference">Inference prices</Link></Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { offerings, groups, quoteRequired } = loaded.comparison;
  const byId = new Map(offerings.map((o) => [o.id, o]));
  const specRows = SPEC_ROWS.filter((row) => offerings.some((o) => row.value(o)));
  const quoteOfferings = [...new Set(quoteRequired.map((q) => q.offeringId))].flatMap((id) => byId.get(id) ?? []);
  const gpu = gpuOptions(offerings);
  const inference = inferenceOptions(offerings);

  return (
    <>
      <PageHeader
        eyebrow="Compare"
        title={<>Comparing {offerings.length} <em>{offerings.length === 1 ? "offering" : "offerings"}</em></>}
        description="Prices are only ranked against prices in the same unit, currency and billing mode. Per-instance prices are converted to per-GPU where the GPU count is known."
      />

      <div className="container mx-auto space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <AffiliateDisclosure />

        <section aria-labelledby="price-groups" className="space-y-4">
          <h2 id="price-groups" className="text-lg font-semibold">Prices</h2>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">None of these offerings has a public price to compare.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {groups.map((group) => (
                <PriceGroup key={`${group.unit}-${group.currency}-${group.billingMode}`} group={group} offerings={byId} />
              ))}
            </div>
          )}
          {quoteOfferings.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">Contact for pricing</h3>
              <p className="mt-1 text-xs text-muted-foreground">No public rate — these aren&apos;t ranked.</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {quoteOfferings.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2">
                    <span className="text-sm">{o.provider.name} · {o.name}</span>
                    <ProviderCTA provider={o.provider} offeringId={o.id} source="compare-quote" label="Get a quote" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section aria-labelledby="specs" className="space-y-4">
          <h2 id="specs" className="text-lg font-semibold">Specifications</h2>

          {/* Desktop: offerings as columns. */}
          <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left">
                <tr>
                  <th scope="col" className="w-40 px-4 py-3"><span className="sr-only">Specification</span></th>
                  {offerings.map((o) => (
                    <th key={o.id} scope="col" className="min-w-44 px-4 py-3 align-top font-normal">
                      <div className="flex items-center gap-2">
                        <ProviderLogo provider={o.provider} className="h-7 w-7" />
                        <div>
                          <p className="flex flex-wrap items-center gap-2">
                            <Link href={`/compute/providers/${o.provider.slug}`} className="text-sm font-medium hover:underline">{o.provider.name}</Link>
                            <FeaturedBadge provider={o.provider} />
                          </p>
                          <p className="text-xs text-muted-foreground">{o.name}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {specRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{row.label}</th>
                    {offerings.map((o) => (
                      <td key={o.id} className="px-4 py-2.5">{row.value(o) ?? "—"}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="px-4 py-3"><span className="sr-only">Provider link</span></th>
                  {offerings.map((o) => (
                    <td key={o.id} className="px-4 py-3">
                      <ProviderCTA provider={o.provider} offeringId={o.id} source="compare" label="Visit" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile: one card per offering. */}
          <ul className="grid gap-3 md:hidden">
            {offerings.map((o) => (
              <li key={o.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <ProviderLogo provider={o.provider} />
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {o.provider.name}
                      <FeaturedBadge provider={o.provider} />
                    </p>
                    <p className="text-xs text-muted-foreground">{o.name}</p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {specRows.map((row) => (
                    <div key={row.label} className="contents">
                      <dt className="text-xs text-muted-foreground">{row.label}</dt>
                      <dd>{row.value(o) ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
                <ProviderCTA provider={o.provider} offeringId={o.id} source="compare" className="mt-4 w-full" />
              </li>
            ))}
          </ul>
        </section>

        {(gpu.length > 0 || inference.length > 0) && (
          <section aria-label="Cost calculators" className="grid gap-6 lg:grid-cols-2">
            {gpu.length > 0 && <GpuCostCalculator options={gpu} />}
            {inference.length > 0 && <InferenceCostCalculator options={inference} />}
          </section>
        )}
      </div>
    </>
  );
}
