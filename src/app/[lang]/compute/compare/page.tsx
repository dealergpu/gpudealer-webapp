import { Link } from "@/i18n/navigation";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.compare.metaTitle,
    description: t.compare.metaDescription,
    // Arbitrary selections aren't useful search results.
    robots: { index: false, follow: true },
  };
}

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

function groupTitle(group: ComputeComparisonGroup, t: Messages): string {
  const billing = group.billingMode === ComputeBillingMode.ON_DEMAND ? null : t.computeLabels.billing[group.billingMode];
  return [t.computeLabels.unitTitles[group.unit], billing, group.currency].filter(Boolean).join(" · ");
}

function PriceGroup({ group, offerings, t }: { group: ComputeComparisonGroup; offerings: Map<string, ComputeOffering>; t: Messages }) {
  const ranked = group.offeringCount > 1;
  const units = t.computeLabels.units;
  return (
    <section aria-label={groupTitle(group, t)} className="rounded-3xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{groupTitle(group, t)}</h3>
      {!ranked && <p className="mt-1 text-xs text-muted-foreground">{t.compare.onlyOne}</p>}
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
                    <span className="text-xs text-muted-foreground">{units[group.unit]}</span>
                  </p>
                  {entry.isDerived && (
                    <p className="text-xs text-muted-foreground">
                      {fmt(t.compare.derivedFrom, { amount: formatMoney(entry.amount, group.currency), unit: units[entry.unit] })}
                      {offering.gpuCount ? fmt(t.compare.gpuCount, { count: offering.gpuCount }) : ""}
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

function specRowsFor(t: Messages): SpecRow[] {
  const s = t.compare.specs;
  return [
    { label: s.type, value: (o) => t.computeLabels.offeringTypes[o.offeringType] },
    { label: s.gpu, value: (o) => o.gpuModel },
    { label: s.vramPerGpu, value: (o) => (o.gpuVramGb ? `${o.gpuVramGb} GB` : null) },
    { label: s.gpuCount, value: (o) => (o.gpuCount ? String(o.gpuCount) : null) },
    { label: s.architecture, value: (o) => o.gpuArchitecture },
    { label: s.cpu, value: (o) => o.cpuDescription },
    { label: s.ram, value: (o) => (o.ramGb ? `${o.ramGb} GB` : null) },
    { label: s.storage, value: (o) => o.storageDescription },
    { label: s.model, value: (o) => o.modelName },
    { label: s.modelBy, value: (o) => o.modelProvider },
    { label: s.contextLength, value: (o) => (o.contextLength ? formatContextLength(o.contextLength) : null) },
    ...CAPABILITIES.map(({ key }) => ({
      label: t.computeLabels.capabilities[key],
      value: (o: ComputeOffering) => (o.modelName ? yesNo(o[key], t.computeLabels) : null),
    })),
    { label: s.regions, value: (o) => (o.regions.length ? o.regions.join(", ") : null) },
  ];
}

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
  const { t } = await getI18n();
  const c = t.compare;

  if ("error" in loaded) {
    const [title, body] = c.errors[loaded.error].map((text) => fmt(text, { max: MAX }));
    return (
      <>
        <PageHeader eyebrow={c.eyebrow} title={<>{c.emptyTitleStart} <em>{c.emptyTitleEm}</em></>} />
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div role={loaded.error === "none" ? undefined : "alert"} className="rounded-3xl border border-border bg-card px-6 py-14 text-center">
            <p className="font-display text-3xl">{title}</p>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">{body}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline"><Link href="/compute/gpu-cloud">{c.gpuCloudPrices}</Link></Button>
              <Button asChild variant="outline"><Link href="/compute/inference">{c.inferencePrices}</Link></Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { offerings, groups, quoteRequired } = loaded.comparison;
  const byId = new Map(offerings.map((o) => [o.id, o]));
  const specRows = specRowsFor(t).filter((row) => offerings.some((o) => row.value(o)));
  const quoteOfferings = [...new Set(quoteRequired.map((q) => q.offeringId))].flatMap((id) => byId.get(id) ?? []);
  const gpu = gpuOptions(offerings);
  const inference = inferenceOptions(offerings);

  return (
    <>
      <PageHeader
        eyebrow={c.eyebrow}
        title={<>{fmt(c.comparing, { count: offerings.length })} <em>{offerings.length === 1 ? c.offeringOne : c.offeringMany}</em></>}
        description={c.description}
      />

      <div className="container mx-auto space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <AffiliateDisclosure />

        <section aria-labelledby="price-groups" className="space-y-4">
          <h2 id="price-groups" className="text-lg font-semibold">{c.prices}</h2>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{c.noPublicPrices}</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {groups.map((group) => (
                <PriceGroup key={`${group.unit}-${group.currency}-${group.billingMode}`} group={group} offerings={byId} t={t} />
              ))}
            </div>
          )}
          {quoteOfferings.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">{c.contactForPricing}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{c.notRanked}</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {quoteOfferings.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2">
                    <span className="text-sm">{o.provider.name} · {o.name}</span>
                    <ProviderCTA provider={o.provider} offeringId={o.id} source="compare-quote" label={c.getQuote} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section aria-labelledby="specs" className="space-y-4">
          <h2 id="specs" className="text-lg font-semibold">{c.specifications}</h2>

          {/* Desktop: offerings as columns. */}
          <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left">
                <tr>
                  <th scope="col" className="w-40 px-4 py-3"><span className="sr-only">{c.specification}</span></th>
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
                  <th scope="row" className="px-4 py-3"><span className="sr-only">{c.providerLink}</span></th>
                  {offerings.map((o) => (
                    <td key={o.id} className="px-4 py-3">
                      <ProviderCTA provider={o.provider} offeringId={o.id} source="compare" label={c.visit} />
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
          <section aria-label={c.calculators} className="grid gap-6 lg:grid-cols-2">
            {gpu.length > 0 && <GpuCostCalculator options={gpu} />}
            {inference.length > 0 && <InferenceCostCalculator options={inference} />}
          </section>
        )}
      </div>
    </>
  );
}
