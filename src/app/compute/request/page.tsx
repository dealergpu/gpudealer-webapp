import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComputeRequestForm } from "@/components/compute/ComputeRequestForm";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Tell Us What Compute You Need",
  description: "Need dedicated GPU capacity, reserved clusters or high-volume inference? Tell GPUDealer your workload, volume and budget.",
  alternates: { canonical: "/compute/request" },
};

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim().slice(0, 200) || undefined;
}

// Public: sign-in is optional for compute requests.
export default async function ComputeRequestPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="Compute request"
        title={<>Tell us what <em>compute</em> you need</>}
        description="Dedicated endpoints, reserved clusters, high-volume inference — describe the workload and we'll get back to you with options."
      />
      <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <ComputeRequestForm defaults={{ gpuModel: first(params.gpu)?.slice(0, 100), modelName: first(params.model) }} />
      </div>
    </>
  );
}
