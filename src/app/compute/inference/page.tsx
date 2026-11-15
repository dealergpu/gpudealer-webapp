import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/site";
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
import { UNIT_LABELS, formatContextLength, formatPriceAmount, pickPrice } from "@/lib/compute";
import { ComputeFilters, type FilterField } from "@/components/compute/ComputeFilters";
import { CompareToggle } from "@/components/compute/CompareSelection";
import { InferenceCostCalculator, type InferencePriceOption } from "@/components/compute/CostCalculators";
import { PricingStatus, PriceTags } from "@/components/compute/PricingStatus";
import { ProviderCTA } from "@/components/compute/ProviderCTA";
import { ProviderLogo } from "@/components/compute/ProviderLogo";
import { Capabilities } from "@/components/compute/Capabilities";
import { AffiliateDisclosure } from "@/components/compute/AffiliateDisclosure";
import { ComputeEmpty, ComputeError, Pager } from "@/components/compute/ComputeStates";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "AI Inference API Pricing — Compare Providers",
  description:
    "Compare inference API prices for Llama, Qwen, DeepSeek and other open models across providers — input and output token prices, context length and API features.",
  alternates: { canonical: "/compute/inference" },
};

const BASE_PATH = "/compute/inference";
const PAGE_SIZE = 50;
const ANY = "any";
const SORTS = { provider: "Provider (A–Z)", input: "Lowest input price", output: "Lowest output price" } as const;
type Sort = keyof typeof SORTS;

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
    sort: (sort && sort in SORTS ? sort : "provider") as Sort,
    page: Math.max(1, Math.floor(Number(first(searchParams.page))) || 1),
  };
}

type Filters = ReturnType<typeof parseFilters>;

async function loadOfferings(filters: Filters): Promise<ComputeOfferingsResponse | null> {
  try {
    return await getComputeOfferings({
      type: ComputeOfferingType.MODEL_INFERENCE,
      modelName: filters.model,
      provider: filters.provider,
      region: filters.region,
      openAiCompatible: filters.openai,
      page: filters.page,
      limit: PAGE_SIZE,
    });
  } catch {
    return null;
  }
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

function TokenPrice({ price }: { price?: ComputePrice }) {
  if (!price) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="whitespace-nowrap font-mono text-base font-semibold tabular-nums">{formatPriceAmount(price)}</span>
      <PriceTags price={price} className="justify-end" />
    </div>
  );
}

function OtherPrice({ price }: { price?: ComputePrice }) {
  if (!price) return <span className="text-sm text-muted-foreground">No public price yet</span>;
  return (
    <span className="text-sm">
      <span className="font-medium">{formatPriceAmount(price)}</span>{" "}
      {price.amount != null && <span className="text-xs text-muted-foreground">{UNIT_LABELS[price.unit]}</span>}
    </span>
  );
}

function ModelCell({ offering }: { offering: ComputeOffering }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <ProviderLogo provider={offering.provider} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{offering.name}</p>
        <p className="text-xs text-muted-foreground">
          <Link href={`/compute/providers/${offering.provider.slug}`} className="hover:underline">
            {offering.provider.name}
          </Link>
          {offering.modelProvider && <> · by {offering.modelProvider}</>}
          {offering.modelName && offering.modelName !== offering.name && <> · {offering.modelName}</>}
        </p>
      </div>
    </div>
  );
}

function statusPrice(row: Row) {
  return row.input ?? row.output ?? row.other;
}

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
  const [result, { models, providers }] = await Promise.all([loadOfferings(filters), loadFilterOptions()]);
  const rows = result ? sortRows(result.data.map(toRow), filters.sort) : [];

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
      label: "Model",
      defaultValue: ANY,
      options: [{ value: ANY, label: "Any model" }, ...modelNames.map((name) => ({ value: name, label: name }))],
    },
    {
      kind: "select",
      name: "provider",
      label: "Provider",
      defaultValue: ANY,
      options: [{ value: ANY, label: "Any provider" }, ...providerOptions],
    },
    { kind: "text", name: "region", label: "Region", placeholder: "e.g. US, EU", maxLength: 50 },
    {
      kind: "select",
      name: "openai",
      label: "OpenAI-compatible API",
      defaultValue: ANY,
      options: [
        { value: ANY, label: "Either" },
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    },
    {
      kind: "select",
      name: "sort",
      label: "Sort by",
      defaultValue: "provider",
      options: Object.entries(SORTS).map(([value, label]) => ({ value, label })),
    },
  ];

  const total = result?.pagination.total;
  const multiPage = (result?.pagination.totalPages ?? 1) > 1;

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbJsonLd([["Compute", "/compute"], ["Inference APIs", "/compute/inference"]]) }} />
      <PageHeader
        eyebrow="Inference"
        title={<>Compare AI <em>inference</em> providers</>}
        description="Hosted model APIs, priced per million tokens. Input and output prices are always shown separately, with when each was last checked."
      />

      <div className="container mx-auto space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <ComputeFilters basePath={BASE_PATH} fields={fields} values={urlValues} />

        <section aria-label="Inference prices" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {total != null ? (
                <>
                  <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString("en-US")}</span>{" "}
                  {total === 1 ? "offering" : "offerings"} · prices per 1M tokens
                  {multiPage && filters.sort !== "provider" && " · sorted within this page"}
                </>
              ) : (
                "Inference offerings"
              )}
            </p>
            <AffiliateDisclosure className="max-w-xl" />
          </div>

          {result === null ? (
            <ComputeError what="inference prices" retryHref={pageHref(filters.page)} />
          ) : rows.length > 0 ? (
            <>
              <div className="hidden overflow-hidden rounded-3xl border border-border bg-card lg:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Model</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Context</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Input / 1M</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Output / 1M</th>
                      <th scope="col" className="px-4 py-3 font-medium">API</th>
                      <th scope="col" className="px-4 py-3 font-medium">Pricing status</th>
                      <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => {
                      const status = statusPrice(row);
                      return (
                        <tr key={row.offering.id} className="align-top">
                          <td className="px-4 py-4"><ModelCell offering={row.offering} /></td>
                          <td className="px-4 py-4 text-right tabular-nums">
                            {row.offering.contextLength ? formatContextLength(row.offering.contextLength) : "—"}
                          </td>
                          {row.input || row.output ? (
                            <>
                              <td className="px-4 py-4 text-right"><TokenPrice price={row.input} /></td>
                              <td className="px-4 py-4 text-right"><TokenPrice price={row.output} /></td>
                            </>
                          ) : (
                            <td colSpan={2} className="px-4 py-4 text-right"><OtherPrice price={row.other} /></td>
                          )}
                          <td className="px-4 py-4"><Capabilities offering={row.offering} /></td>
                          <td className="px-4 py-4">{status && <PricingStatus price={status} />}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col items-end gap-3">
                              <ProviderCTA provider={row.offering.provider} offeringId={row.offering.id} source="inference-table" label="Visit" />
                              <CompareToggle item={compareItem(row.offering)} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
                {rows.map((row) => {
                  const status = statusPrice(row);
                  return (
                    <li key={row.offering.id} className="flex flex-col rounded-2xl border border-border bg-card p-4">
                      <ModelCell offering={row.offering} />
                      {row.input || row.output ? (
                        <dl className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <dt className="text-xs text-muted-foreground">Input / 1M</dt>
                            <dd className="mt-1 [&>div]:items-start"><TokenPrice price={row.input} /></dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Output / 1M</dt>
                            <dd className="mt-1 [&>div]:items-start"><TokenPrice price={row.output} /></dd>
                          </div>
                        </dl>
                      ) : (
                        <p className="mt-4"><OtherPrice price={row.other} /></p>
                      )}
                      <div className="mt-4 flex items-start justify-between gap-4">
                        <Capabilities offering={row.offering} />
                        <p className="text-right text-xs">
                          <span className="text-muted-foreground">Context</span>{" "}
                          <span className="font-medium tabular-nums">
                            {row.offering.contextLength ? formatContextLength(row.offering.contextLength) : "—"}
                          </span>
                        </p>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-4">
                        {status ? <PricingStatus price={status} /> : <span />}
                        <CompareToggle item={compareItem(row.offering)} />
                      </div>
                      <ProviderCTA provider={row.offering.provider} offeringId={row.offering.id} source="inference-table" className="mt-4 w-full" />
                    </li>
                  );
                })}
              </ul>
              <Pager page={filters.page} totalPages={result.pagination.totalPages} href={pageHref} />
            </>
          ) : (
            <ComputeEmpty
              title="No matching inference offerings."
              clearHref={BASE_PATH}
              requestHref={filters.model ? `/compute/request?model=${encodeURIComponent(filters.model)}` : "/compute/request"}
            />
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section aria-labelledby="reading-inference" className="prose prose-sm max-w-none dark:prose-invert">
            <h2 id="reading-inference">How inference pricing works</h2>
            <ul>
              <li>
                Inference APIs bill per token. <strong>Input</strong> tokens (your prompt) and <strong>output</strong> tokens
                (the model&apos;s reply) have separate prices — output is usually several times more expensive, so the mix of your
                workload matters more than either number alone.
              </li>
              <li>
                The same model can differ between providers in version, quantization, context length, speed and limits. Check the
                exact model on the provider&apos;s site before switching.
              </li>
              <li>
                The headline rate is the standard on-demand price. Batch, cached-prompt and committed-use discounts aren&apos;t
                included.
              </li>
              <li>
                Need guaranteed capacity or a private deployment? Dedicated inference is usually quote-based —{" "}
                <Link href="/compute/request">tell us what you need</Link>.
              </li>
            </ul>
          </section>
          <InferenceCostCalculator options={calculatorOptions(rows)} />
        </div>
      </div>
    </>
  );
}
