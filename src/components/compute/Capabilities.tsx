import type { ComputeOffering } from "@/lib/api";

// null means the capability is unknown — shown as "—", never as "No".
function yesNo(value: boolean | null): string {
  return value == null ? "—" : value ? "Yes" : "No";
}

export const CAPABILITIES = [
  { key: "openAiCompatible", label: "OpenAI-compatible" },
  { key: "supportsStreaming", label: "Streaming" },
  { key: "supportsFineTuning", label: "Fine-tuning" },
] as const;

export function Capabilities({ offering }: { offering: Pick<ComputeOffering, (typeof CAPABILITIES)[number]["key"]> }) {
  return (
    <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-xs">
      {CAPABILITIES.map(({ key, label }) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium">{yesNo(offering[key])}</dd>
        </div>
      ))}
    </dl>
  );
}

export { yesNo };
