import type { Metadata } from "next";
import { alternatesFor, getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/site";
import { PageHeader } from "@/components/layout/PageHeader";
import { GpuCloudView, type SearchParams } from "@/components/compute/GpuCloudView";
import { findGpuPage, hasGpuPricing } from "@/lib/compute";

type Params = Promise<{ gpu: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { t } = await getI18n();
  const gpu = findGpuPage((await params).gpu);
  if (!gpu) return { title: t.gpuCloudPage.notFound, robots: { index: false } };

  const indexable = await hasGpuPricing(gpu.slug);
  return {
    title: fmt(t.gpuCloudPage.modelMetaTitle, { gpu: gpu.label }),
    description: fmt(t.gpuCloudPage.modelMetaDescription, { gpu: gpu.label }),
    alternates: await alternatesFor(`/compute/gpu-cloud/${gpu.slug}`),
    // No current prices → a thin page; keep it out of the index until there are.
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function GpuModelPage({ params, searchParams }: { params: Params; searchParams: Promise<SearchParams> }) {
  const gpu = findGpuPage((await params).gpu);
  if (!gpu) notFound();
  const { t, locale } = await getI18n();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...breadcrumbJsonLd([
            [t.computeUi.breadcrumbCompute, "/compute"],
            [t.computeUi.breadcrumbGpuCloud, "/compute/gpu-cloud"],
            [gpu.label, `/compute/gpu-cloud/${gpu.slug}`],
          ], locale),
        }}
      />
      <PageHeader
        eyebrow={t.gpuCloudPage.eyebrow}
        title={<>{gpu.label} <em>{t.gpuCloudPage.modelTitleEm}</em></>}
        description={fmt(t.gpuCloudPage.modelDescription, { gpu: gpu.label })}
      />
      <GpuCloudView basePath={`/compute/gpu-cloud/${gpu.slug}`} searchParams={await searchParams} gpu={gpu} />
    </>
  );
}
