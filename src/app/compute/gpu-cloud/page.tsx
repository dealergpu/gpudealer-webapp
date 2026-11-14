import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { GpuCloudView, type SearchParams } from "@/components/compute/GpuCloudView";

export const metadata: Metadata = {
  title: "GPU Cloud Pricing — Compare GPU Rental Prices",
  description:
    "Compare GPU cloud prices for H100, H200, A100, L40S, RTX 4090 and more — per GPU-hour or per instance-hour, with when each price was last checked.",
  // Filtered views fold into the main table; per-model pages have their own URLs.
  alternates: { canonical: "/compute/gpu-cloud" },
};

export default async function GpuCloudPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageHeader
        eyebrow="GPU cloud"
        title={<>Compare GPU <em>cloud prices</em></>}
        description="Hourly GPU rental rates across cloud providers. Per-GPU and per-instance prices are listed separately, each with its source and the date it was checked."
      />
      <GpuCloudView basePath="/compute/gpu-cloud" searchParams={await searchParams} />
    </>
  );
}
