import type { ComputeOffering } from "@/lib/api";
import type { Messages } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";

// null means the capability is unknown — shown as "—", never as "No".
function yesNo(value: boolean | null, labels: Pick<Messages["computeLabels"], "yes" | "no">): string {
  return value == null ? "—" : value ? labels.yes : labels.no;
}

/** Capability flags; labels are `t.computeLabels.capabilities[key]`. */
export const CAPABILITIES = [
  { key: "openAiCompatible" },
  { key: "supportsStreaming" },
  { key: "supportsFineTuning" },
] as const;

export async function Capabilities({ offering }: { offering: Pick<ComputeOffering, (typeof CAPABILITIES)[number]["key"]> }) {
  const { t } = await getI18n();
  return (
    <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-xs">
      {CAPABILITIES.map(({ key }) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{t.computeLabels.capabilities[key]}</dt>
          <dd className="font-medium">{yesNo(offering[key], t.computeLabels)}</dd>
        </div>
      ))}
    </dl>
  );
}

export { yesNo };
