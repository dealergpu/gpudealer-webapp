import { Link } from "@/i18n/navigation";
import { alternatesFor, getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/site";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ComputeOfferingType,
  ComputePricingUnit,
  getComputeModels,
  getComputeOfferings,
  getComputeProviders,
  type ComputeOffering,
  type ComputeOfferingsResponse,
  type ComputePrice,
  type GetComputeOfferingsOpenAiCompatible,
} from "@/lib/api";
import { formatContextLength, formatPriceAmount, getFeaturedProviders, pickPrice } from "@/lib/compute";
import { ComputeFilters, type FilterField } from "@/components/compute/ComputeFilters";
import { CompareToggle } from "@/components/compute/CompareSelection";
import { InferenceCostCalculator, type InferencePriceOption } from "@/components/compute/CostCalculators";
import { PricingStatus, PriceTags } from "@/components/compute/PricingStatus";
import { ProviderCTA } from "@/components/compute/ProviderCTA";
import { FeaturedBadge } from "@/components/compute/FeaturedBadge";
import { ProviderLogo } from "@/components/compute/ProviderLogo";
import { Capabilities } from "@/components/compute/Capabilities";
import { AffiliateDisclosure } from "@/components/compute/AffiliateDisclosure";
import { ComputeEmpty, ComputeError, Pager } from "@/components/compute/ComputeStates";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.inference.metaTitle,
    description: t.inference.metaDescription,
    alternates: await alternatesFor("/compute/inference"),
  };
}

const BASE_PATH = "/compute/inference";
const PAGE_SIZE = 50;
const ANY = "any";
const SORTS = ["provider", "input", "output"] as const;
type Sort = (typeof SORTS)[number];

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

function parseFilters(searchParams: SearchParams) {
  const openai = first(searchParams.openai);
  const sort = first(searchParams.sort);
  return {
    model: first(searchParams.model)?.slice(0, 200),
    provider: first(searchParams.provider)?.slice(0, 80),
    region: first(searchParams.region)?.slice(0, 50),
    openai: openai === "true" || openai === "false" ? (openai as GetComputeOfferingsOpenAiCompatible) : undefined,
    sort: SORTS.find((key) => key === sort) ?? "provider",
    page: Math.max(1, Math.floor(Number(first(searchParams.page))) || 1),
  };
}

type Filters = ReturnType<typeof parseFilters>;

function offeringsQuery(filters: Filters) {
  return {
    type: ComputeOfferingType.MODEL_INFERENCE,
    modelName: filters.model,
    provider: filters.provider,
    region: filters.region,
    openAiCompatible: filters.openai,
  };
}

async function loadOfferings(filters: Filters): Promise<ComputeOfferingsResponse | null> {
  try {
    return await getComputeOfferings({ ...offeringsQuery(filters), page: filters.page, limit: PAGE_SIZE });
  } catch {
    return null;
  }
}

/** Featured providers' offerings under the same filters, pinned above the table on page 1. */
async function loadPinnedOfferings(filters: Filters, featuredSlugs: string[]): Promise<ComputeOffering[]> {
  const perProvider = await Promise.all(
    featuredSlugs.map((slug) =>
      getComputeOfferings({ ...offeringsQuery(filters), provider: slug, limit: 100 })
        .then((result) => result.data)
        .catch(() => []),
    ),
  );
  return perProvider.flat();
}

// Filter dropdown contents. If either fails, that filter just has fewer options.
async function loadFilterOptions() {
  const [models, providers] = await Promise.all([
    getComputeModels({ limit: 100 }).then((r) => r.data).catch(() => []),
    getComputeProviders({ limit: 100 }).then((r) => r.data).catch(() => []),
  ]);
  return { models, providers };
}

type Row = {
  offering: ComputeOffering;
  input?: ComputePrice;
  output?: ComputePrice;
  /** When there's no token price: a quote, or a price in another unit. */
  other?: ComputePrice;
};

function toRow(offering: ComputeOffering): Row {
  const input = pickPrice(offering.pricing, ComputePricingUnit.INPUT_MILLION_TOKENS);
  const output = pickPrice(offering.pricing, ComputePricingUnit.OUTPUT_MILLION_TOKENS);
  const other =
    input || output
      ? undefined
      : (offering.pricing.find((p) => p.unit === ComputePricingUnit.CUSTOM_QUOTE) ?? offering.pricing[0]);
  return { offering, input, output, other };
}

// Price sorts only order the rows on this page (the API sorts offerings by
// provider); rows without that price go last, never as "$0".
function sortRows(rows: Row[], sort: Sort): Row[] {
  if (sort === "provider") return rows;
  const key = (row: Row) => {
    const price = sort === "input" ? row.input : row.output;
    return price?.amount != null ? Number(price.amount) : Number.POSITIVE_INFINITY;
  };
  return [...rows].sort((a, b) => key(a) - key(b));
}

function TokenPrice({ price, t }: { price?: ComputePrice; t: Messages }) {
  if (!price) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="whitespace-nowrap font-mono text-base font-semibold tabular-nums">{formatPriceAmount(price, t.computeLabels.contactForPricing)}</span>
      <PriceTags price={price} className="justify-end" />
    </div>
  );
}

function OtherPrice({ price, t }: { price?: ComputePrice; t: Messages }) {
  if (!price) return <span className="text-sm text-muted-foreground">{t.inference.noPublicPrice}</span>;
  return (
    <span className="text-sm">
      <span className="font-medium">{formatPriceAmount(price, t.computeLabels.contactForPricing)}</span>{" "}
      {price.amount != null && <span className="text-xs text-muted-foreground">{t.computeLabels.units[price.unit]}</span>}
    </span>
  );
}

function ModelCell({ offering, t }: { offering: ComputeOffering; t: Messages }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <ProviderLogo provider={offering.provider} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{offering.name}</p>
        <p className="text-xs text-muted-foreground">
          <Link href={`/compute/providers/${offering.provider.slug}`} className="hover:underline">
            {offering.provider.name}
          </Link>
          <FeaturedBadge provider={offering.provider} className="ml-1.5 align-middle" />
          {offering.modelProvider && <> · {fmt(t.inference.byProvider, { provider: offering.modelProvider })}</>}
          {offering.modelName && offering.modelName !== offering.name && <> · {offering.modelName}</>}
        </p>
      </div>
    </div>
  );
}

function statusPrice(row: Row) {
  return row.input ?? row.output ?? row.other;
}

function InferenceRow({ row, source, t }: { row: Row; source: string; t: Messages }) {
  const status = statusPrice(row);
  return (
    <tr className="align-top">
      <td className="px-4 py-4"><ModelCell offering={row.offering} t={t} /></td>
      <td className="px-4 py-4 text-right tabular-nums">
        {row.offering.contextLength ? formatContextLength(row.offering.contextLength) : "—"}
      </td>
      {row.input || row.output ? (
        <>
          <td className="px-4 py-4 text-right"><TokenPrice price={row.input} t={t} /></td>
          <td className="px-4 py-4 text-right"><TokenPrice price={row.output} t={t} /></td>
        </>
      ) : (
        <td colSpan={2} className="px-4 py-4 text-right"><OtherPrice price={row.other} t={t} /></td>
      )}
      <td className="px-4 py-4"><Capabilities offering={row.offering} /></td>
      <td className="px-4 py-4">{status && <PricingStatus price={status} />}</td>
      <td className="px-4 py-4">
        <div className="flex flex-col items-end gap-3">
          <ProviderCTA provider={row.offering.provider} offeringId={row.offering.id} source={source} label={t.inference.visit} />
          <CompareToggle item={compareItem(row.offering)} />
        </div>
      </td>
    </tr>
  );
}

function InferenceCard({ row, source, t }: { row: Row; source: string; t: Messages }) {
  const status = statusPrice(row);
  return (
    <li className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <ModelCell offering={row.offering} t={t} />
      {row.input || row.output ? (
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-muted-foreground">{t.inference.inputPer1M}</dt>
            <dd className="mt-1 [&>div]:items-start"><TokenPrice price={row.input} t={t} /></dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t.inference.outputPer1M}</dt>
            <dd className="mt-1 [&>div]:items-start"><TokenPrice price={row.output} t={t} /></dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4"><OtherPrice price={row.other} t={t} /></p>
      )}
      <div className="mt-4 flex items-start justify-between gap-4">
        <Capabilities offering={row.offering} />
        <p className="text-right text-xs">
          <span className="text-muted-foreground">{t.inference.context}</span>{" "}
          <span className="font-medium tabular-nums">
            {row.offering.contextLength ? formatContextLength(row.offering.contextLength) : "—"}
          </span>
        </p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        {status ? <PricingStatus price={status} /> : <span />}
        <CompareToggle item={compareItem(row.offering)} />
      </div>
      <ProviderCTA provider={row.offering.provider} offeringId={row.offering.id} source={source} className="mt-4 w-full" />
    </li>
  );
}

const GROUP_HEADING = "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground";

function compareItem(offering: ComputeOffering) {
  return { id: offering.id, label: `${offering.provider.name} · ${offering.name}` };
}

function calculatorOptions(rows: Row[]): InferencePriceOption[] {
  return rows.flatMap(({ offering, input, output }) =>
    input?.amount != null && output?.amount != null && input.currency === output.currency
      ? [{ id: offering.id, label: `${offering.provider.name} · ${offering.name}`, inputAmount: input.amount, outputAmount: output.amount, currency: input.currency }]
      : [],
  );
}

export default async function InferencePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseFilters(await searchParams);
  const { t, locale } = await getI18n();
  const n = t.inference;
  const [result, { models, providers }, featured] = await Promise.all([
    loadOfferings(filters),
    loadFilterOptions(),
    getFeaturedProviders(),
  ]);

  // Featured providers' offerings are pinned on page 1 and left out of the
  // sorted rows on every page — unless one provider is filtered for.
  const featuredSlugs = filters.provider || !featured ? [] : featured.map((provider) => provider.slug);
  const pinnedOfferings = filters.page === 1 ? await loadPinnedOfferings(filters, featuredSlugs) : [];
  const pinned = sortRows(pinnedOfferings.map(toRow), filters.sort);
  const rows = sortRows(
    (result?.data ?? []).filter((offering) => !featuredSlugs.includes(offering.provider.slug)).map(toRow),
    filters.sort,
  );
  const groups = [
    { key: "featured", label: n.featuredGroup, rows: pinned, source: "inference-table-featured" },
    { key: "ranked", label: pinned.length > 0 ? fmt(n.otherProviders, { sort: n.sorts[filters.sort] }) : null, rows, source: "inference-table" },
  ].filter((group) => group.rows.length > 0);

  const urlValues: Record<string, string | undefined> = {
    model: filters.model,
    provider: filters.provider,
    region: filters.region,
    openai: filters.openai,
    sort: filters.sort === "provider" ? undefined : filters.sort,
  };
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(urlValues)) if (value) params.set(key, value);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `${BASE_PATH}?${query}` : BASE_PATH;
  };

  const modelNames = models.map((m) => m.modelName);
  if (filters.model && !modelNames.includes(filters.model)) modelNames.unshift(filters.model);
  const providerOptions = providers.map((p) => ({ value: p.slug, label: p.name }));
  if (filters.provider && !providers.some((p) => p.slug === filters.provider)) {
    providerOptions.unshift({ value: filters.provider, label: filters.provider });
  }

  const fields: FilterField[] = [
    {
      kind: "select",
      name: "model",
      label: n.model,
      defaultValue: ANY,
      options: [{ value: ANY, label: n.anyModel }, ...modelNames.map((name) => ({ value: name, label: name }))],
    },
    {
      kind: "select",
      name: "provider",
      label: n.provider,
      defaultValue: ANY,
      options: [{ value: ANY, label: n.anyProvider }, ...providerOptions],
    },
    { kind: "text", name: "region", label: n.region, placeholder: n.regionPlaceholder, maxLength: 50 },
    {
      kind: "select",
      name: "openai",
      label: n.openAi,
      defaultValue: ANY,
      options: [
        { value: ANY, label: n.either },
        { value: "true", label: t.computeLabels.yes },
        { value: "false", label: t.computeLabels.no },
      ],
    },
    {
      kind: "select",
      name: "sort",
      label: n.sortBy,
      defaultValue: "provider",
      options: Object.entries(n.sorts).map(([value, label]) => ({ value, label })),
    },
  ];

  const total = result?.pagination.total;
  const multiPage = (result?.pagination.totalPages ?? 1) > 1;

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbJsonLd([[t.computeUi.breadcrumbCompute, "/compute"], [n.breadcrumb, "/compute/inference"]], locale) }} />
      <PageHeader
        eyebrow={n.eyebrow}
        title={<>{n.titleStart} <em>{n.titleEm}</em> {n.titleEnd}</>}
        description={n.description}
      />

      <div className="container mx-auto space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <ComputeFilters basePath={BASE_PATH} fields={fields} values={urlValues} />

        <section aria-label={n.pricesLabel} className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {total != null ? (
                <>
                  <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString("en-US")}</span>{" "}
                  {total === 1 ? n.offeringOne : n.offeringMany}{n.perMillion}
                  {multiPage && filters.sort !== "provider" && n.sortedWithinPage}
                </>
              ) : (
                n.offeringsLabel
              )}
            </p>
            <AffiliateDisclosure className="max-w-xl" />
          </div>

          {result === null ? (
            <ComputeError what={n.pricesWhat} retryHref={pageHref(filters.page)} />
          ) : groups.length > 0 ? (
            <>
              <div className="hidden overflow-hidden rounded-3xl border border-border bg-card lg:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">{n.model}</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">{n.context}</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">{n.inputPer1M}</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">{n.outputPer1M}</th>
                      <th scope="col" className="px-4 py-3 font-medium">{n.api}</th>
                      <th scope="col" className="px-4 py-3 font-medium">{n.pricingStatus}</th>
                      <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">{n.actions}</span></th>
                    </tr>
                  </thead>
                  {groups.map((group) => (
                    <tbody key={group.key} className="divide-y divide-border border-b border-border last:border-b-0">
                      {group.label && (
                        <tr className="bg-muted/20">
                          <th scope="colgroup" colSpan={7} className={cn("px-4 py-2 text-left", GROUP_HEADING)}>{group.label}</th>
                        </tr>
                      )}
                      {group.rows.map((row) => <InferenceRow key={row.offering.id} row={row} source={group.source} t={t} />)}
                    </tbody>
                  ))}
                </table>
              </div>

              <ul className="space-y-5 lg:hidden">
                {groups.map((group) => (
                  <li key={group.key} className="space-y-3">
                    {group.label && <p className={GROUP_HEADING}>{group.label}</p>}
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {group.rows.map((row) => <InferenceCard key={row.offering.id} row={row} source={group.source} t={t} />)}
                    </ul>
                  </li>
                ))}
              </ul>
              <Pager page={filters.page} totalPages={result.pagination.totalPages} href={pageHref} />
            </>
          ) : (
            <ComputeEmpty
              title={n.empty}
              clearHref={BASE_PATH}
              requestHref={filters.model ? `/compute/request?model=${encodeURIComponent(filters.model)}` : "/compute/request"}
            />
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section aria-labelledby="reading-inference" className="prose prose-sm max-w-none dark:prose-invert">
            <h2 id="reading-inference">{n.howTitle}</h2>
            <ul>
              <li>
                {n.how1Start} <strong>{n.how1InputStrong}</strong> {n.how1Input} <strong>{n.how1OutputStrong}</strong> {n.how1Output}
              </li>
              <li>{n.how2}</li>
              <li>{n.how3}</li>
              <li>
                {n.how4}{" "}
                <Link href="/compute/request">{n.how4Link}</Link>.
              </li>
            </ul>
          </section>
          <InferenceCostCalculator options={calculatorOptions([...pinned, ...rows])} />
        </div>
      </div>
    </>
  );
}
