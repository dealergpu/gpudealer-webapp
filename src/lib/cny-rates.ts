import { FALLBACK_CNY_RATES, type CnyRates } from "@/lib/cny";

// European Central Bank reference rates via Frankfurter (free, no API key,
// no attribution requirement). Base CNY, so each rate is "units per 1 CNY".
const RATES_URL = "https://api.frankfurter.dev/v1/latest?base=CNY";
const TTL_MS = 6 * 60 * 60 * 1000; // ECB publishes once per working day
const TIMEOUT_MS = 2500;

let cached: { value: CnyRates; expires: number } | null = null;

/**
 * Approximate CNY exchange rates for the Chinese site. Cached in memory per
 * worker isolate; falls back to fixed rates if the source is slow or down,
 * so a page never fails or waits long over a currency hint.
 */
export async function getCnyRates(): Promise<CnyRates> {
  if (cached && cached.expires > Date.now()) return cached.value;
  try {
    const res = await fetch(RATES_URL, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: TTL_MS / 1000 } });
    if (!res.ok) throw new Error(`FX rates ${res.status}`);
    const body = (await res.json()) as { date?: string; rates?: Record<string, number> };
    const rates: Record<string, number> = { CNY: 1 };
    for (const [code, perCny] of Object.entries(body.rates ?? {})) {
      if (perCny > 0) rates[code] = 1 / perCny;
    }
    if (!rates.USD) throw new Error("FX rates missing USD");
    const value: CnyRates = { rates: { ...FALLBACK_CNY_RATES.rates, ...rates }, date: body.date ?? null };
    cached = { value, expires: Date.now() + TTL_MS };
    return value;
  } catch {
    // Retry soon rather than hammering the source on every request.
    cached = { value: FALLBACK_CNY_RATES, expires: Date.now() + 10 * 60 * 1000 };
    return FALLBACK_CNY_RATES;
  }
}
