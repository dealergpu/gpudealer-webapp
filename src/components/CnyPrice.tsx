'use client';

import { useCnyRates, useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { formatCny, toCny } from "@/lib/cny";
import { cn } from "@/lib/utils";

/**
 * "≈ ¥8,875" under a price, on the Chinese site only. Renders nothing in
 * English, when there's no price, or when the price is already in CNY.
 */
export function CnyPrice({
  amount,
  currency,
  className,
}: {
  amount: string | number | null | undefined;
  currency: string | null | undefined;
  className?: string;
}) {
  const { t } = useI18n();
  const rates = useCnyRates();
  const cny = toCny(amount, currency, rates);
  if (cny == null) return null;

  return (
    <p className={cn("text-xs text-muted-foreground tabular-nums", className)} title={fmt(t.currency.cnyNote, { currency: (currency || "USD").toUpperCase() })}>
      {fmt(t.currency.cnyApprox, { amount: formatCny(cny) })}
    </p>
  );
}
