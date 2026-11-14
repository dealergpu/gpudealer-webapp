import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { GpuCloudView, type SearchParams } from "@/components/compute/GpuCloudView";
import { findGpuPage, hasGpuPricing } from "@/lib/compute";

type Params = Promise<{ gpu: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const gpu = findGpuPage((await params).gpu);
  if (!gpu) return { title: "Not found", robots: { index: false } };

  const indexable = await hasGpuPricing(gpu.slug);
  return {
    title: `${gpu.label} Cloud Pricing — Compare ${gpu.label} Rental Prices`,
    description: `Compare ${gpu.label} cloud GPU prices across providers: on-demand, spot and reserved rates per GPU-hour or per instance, with when each price was last checked.`,
    alternates: { canonical: `/compute/gpu-cloud/${gpu.slug}` },
    // No current prices → a thin page; keep it out of the index until there are.
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function GpuModelPage({ params, searchParams }: { params: Params; searchParams: Promise<SearchParams> }) {
  const gpu = findGpuPage((await params).gpu);
  if (!gpu) notFound();

  return (
    <>
      <PageHeader
        eyebrow="GPU cloud"
        title={<>{gpu.label} <em>cloud pricing</em></>}
        description={`What ${gpu.label} GPUs cost to rent, across cloud providers. Per-GPU and per-instance prices are listed separately, each with its source and the date it was checked.`}
      />
      <GpuCloudView basePath={`/compute/gpu-cloud/${gpu.slug}`} searchParams={await searchParams} gpu={gpu} />
    </>
  );
}
