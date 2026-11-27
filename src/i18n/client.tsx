'use client';

import { createContext, useContext, type ReactNode } from "react";
import { INTL_LOCALE, type Locale } from "./config";
import type { Messages } from "./messages";
import type { CnyRates } from "@/lib/cny";

type I18nValue = { locale: Locale; t: Messages; cnyRates: CnyRates | null };

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Mounted by the root layout with the current locale's messages, so Client
 * Components can translate without importing every locale file.
 */
export function I18nProvider({ children, ...value }: I18nValue & { children: ReactNode }) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18nContext(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}

/** Locale + messages (`t`) + Intl tag for a Client Component. */
export function useI18n(): { locale: Locale; t: Messages; intl: string } {
  const { locale, t } = useI18nContext();
  return { locale, t, intl: INTL_LOCALE[locale] };
}

export function useLocale(): Locale {
  return useI18nContext().locale;
}

/** Approximate CNY exchange rates; only provided on the Chinese site. */
export function useCnyRates(): CnyRates | null {
  return useI18nContext().cnyRates;
}
