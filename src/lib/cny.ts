/**
 * Approximate Chinese yuan conversions for listing prices on the Chinese site.
 * Listings keep their original price and currency; the CNY figure is only a
 * guide shown underneath it.
 */

/** CNY per one unit of each currency, e.g. `{ USD: 7.1 }`. */
export type CnyRates = { rates: Record<string, number>; date: string | null };

/**
 * Used when the live rates can't be fetched (ECB reference rates, Nov 2026).
 * Rounded — it's an approximation either way.
 */
export const FALLBACK_CNY_RATES: CnyRates = {
  date: null,
  rates: { CNY: 1, USD: 6.65, EUR: 7.29, GBP: 8.73, CAD: 4.67, AUD: 4.44, HKD: 0.85, SGD: 5.16, JPY: 0.042, INR: 0.072, KRW: 0.005 },
};

/** The amount converted to CNY, or null when there's nothing sensible to show. */
export function toCny(amount: string | number | null | undefined, currency: string | null | undefined, rates: CnyRates | null): number | null {
  if (!rates || amount == null || amount === "") return null;
  const value = Number(amount);
  const code = (currency || "USD").toUpperCase();
  const rate = rates.rates[code];
  if (!Number.isFinite(value) || !rate || code === "CNY") return null;
  return value * rate;
}

/** `¥8,875` — whole yuan, since the figure is approximate anyway. */
export function formatCny(amount: number): string {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(amount);
}
