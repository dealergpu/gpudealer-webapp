import type { Metadata } from "next";
import { alternatesFor, getI18n } from "@/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/site";
import { PageHeader } from "@/components/layout/PageHeader";
import { GpuCloudView, type SearchParams } from "@/components/compute/GpuCloudView";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.gpuCloudPage.metaTitle,
    description: t.gpuCloudPage.metaDescription,
    // Filtered views fold into the main table; per-model pages have their own URLs.
    alternates: await alternatesFor("/compute/gpu-cloud"),
  };
}

export default async function GpuCloudPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { t, locale } = await getI18n();
  const g = t.gpuCloudPage;
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbJsonLd([[t.computeUi.breadcrumbCompute, "/compute"], [t.computeUi.breadcrumbGpuCloud, "/compute/gpu-cloud"]], locale) }} />
      <PageHeader
        eyebrow={g.eyebrow}
        title={<>{g.titleStart} <em>{g.titleEm}</em></>}
        description={g.description}
      />
      <GpuCloudView basePath="/compute/gpu-cloud" searchParams={await searchParams} />
    </>
  );
}
