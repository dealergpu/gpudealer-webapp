import { AlertTriangle, BadgeCheck, CircleHelp, Radio, Calculator, MessageSquare } from "lucide-react";
import { ComputeBillingMode, ComputePricingConfidence, type ComputePrice } from "@/lib/api";
import { formatCheckedDate } from "@/lib/compute";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { cn } from "@/lib/utils";

const CONFIDENCE_ICONS = {
  [ComputePricingConfidence.LIVE]: Radio,
  [ComputePricingConfidence.VERIFIED]: BadgeCheck,
  [ComputePricingConfidence.ESTIMATED]: Calculator,
  [ComputePricingConfidence.QUOTE_REQUIRED]: MessageSquare,
  [ComputePricingConfidence.UNKNOWN]: CircleHelp,
};

/**
 * Where a price stands: confidence, when it was last checked
 * (`lastVerifiedAt`; `capturedAt` is when it first appeared), and a visible
 * "may be outdated" marker when the API flags it stale. Always text, never
 * colour alone.
 */
export async function PricingStatus({
  price,
  className,
}: {
  price: Pick<ComputePrice, "confidence" | "capturedAt" | "lastVerifiedAt" | "isStale">;
  className?: string;
}) {
  const { t, intl } = await getI18n();
  const Icon = CONFIDENCE_ICONS[price.confidence];
  return (
    <div className={cn("flex flex-col gap-0.5 text-xs", className)}>
      <span className="inline-flex items-center gap-1 font-medium text-foreground">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        {t.computeLabels.confidence[price.confidence]}
      </span>
      <span className="text-muted-foreground">{fmt(t.computeUi.checked, { date: formatCheckedDate(price.lastVerifiedAt ?? price.capturedAt, intl) })}</span>
      {price.isStale && (
        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" aria-hidden />
          {t.computeUi.mayBeOutdated}
        </span>
      )}
    </div>
  );
}

/** Small tags shown next to a price: non-on-demand billing, region, minimum commitment. */
export async function PriceTags({
  price,
  className,
}: {
  price: Pick<ComputePrice, "billingMode" | "region" | "minimumCommitment">;
  className?: string;
}) {
  const { t } = await getI18n();
  const tags = [
    price.billingMode !== ComputeBillingMode.ON_DEMAND ? t.computeLabels.billing[price.billingMode] : null,
    price.region,
    price.minimumCommitment ? fmt(t.computeUi.minCommitment, { value: price.minimumCommitment }) : null,
  ].filter((tag): tag is string => Boolean(tag));
  if (tags.length === 0) return null;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <span key={tag} className="rounded border border-border px-1.5 py-px font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {tag}
        </span>
      ))}
    </span>
  );
}
