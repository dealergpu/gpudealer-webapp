import type { Metadata } from "next";
import { alternatesFor, getI18n } from "@/i18n/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComputeRequestForm } from "@/components/compute/ComputeRequestForm";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.computeRequestPage.metaTitle,
    description: t.computeRequestPage.metaDescription,
    alternates: await alternatesFor("/compute/request"),
  };
}

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim().slice(0, 200) || undefined;
}

// Public: sign-in is optional for compute requests.
export default async function ComputeRequestPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { t } = await getI18n();
  const r = t.computeRequestPage;
  return (
    <>
      <PageHeader
        eyebrow={r.eyebrow}
        title={<>{r.titleStart} <em>{r.titleEm}</em> {r.titleEnd}</>}
        description={r.description}
      />
      <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <ComputeRequestForm defaults={{ gpuModel: first(params.gpu)?.slice(0, 100), modelName: first(params.model) }} />
      </div>
    </>
  );
}
