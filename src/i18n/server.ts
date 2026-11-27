import type { Metadata } from "next";
import { lang } from "next/root-params";
import { permanentRedirect, redirect } from "next/navigation";
import { DEFAULT_LOCALE, HTML_LANG, INTL_LOCALE, LOCALES, OG_LOCALE, isLocale, localizePath, type Locale } from "./config";
import { MESSAGES, type Messages } from "./messages";
import { SITE_URL } from "@/lib/site";

/** The current request's locale, from the `[lang]` root segment. Server Components only. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Locale + its messages (`t`) for a Server Component or `generateMetadata`. */
export async function getI18n(): Promise<{ locale: Locale; t: Messages; intl: string }> {
  const locale = await getLocale();
  return { locale, t: MESSAGES[locale], intl: INTL_LOCALE[locale] };
}

/** Prefixes an internal path with the current locale (`/gpus` → `/zh/gpus`). */
export async function localizedHref(path: string): Promise<string> {
  return localizePath(path, await getLocale());
}

/** `redirect()` to an internal path in the current locale. */
export async function localizedRedirect(path: string): Promise<never> {
  redirect(await localizedHref(path));
}

/** `permanentRedirect()` to an internal path in the current locale. */
export async function localizedPermanentRedirect(path: string): Promise<never> {
  permanentRedirect(await localizedHref(path));
}

/** Absolute URL of an internal path in the current locale. */
export async function absoluteUrl(path: string): Promise<string> {
  const href = await localizedHref(path);
  return `${SITE_URL}${href === "/" ? "" : href}`;
}

/**
 * `alternates` for a page's metadata: the canonical URL in the current
 * locale plus hreflang links to every language version (and `x-default` →
 * English), so search engines index each version for its own audience.
 * `path` is the unprefixed path, e.g. `/gpus` or `/listing/rtx-4090-abc`.
 */
export async function alternatesFor(path: string): Promise<NonNullable<Metadata["alternates"]>> {
  const locale = await getLocale();
  const languages: Record<string, string> = { "x-default": path };
  for (const l of LOCALES) languages[HTML_LANG[l]] = localizePath(path, l);
  return { canonical: localizePath(path, locale), languages };
}

/** `openGraph.locale` / `alternateLocale` for the current locale. */
export async function openGraphLocale(): Promise<{ locale: string; alternateLocale: string[] }> {
  const locale = await getLocale();
  return { locale: OG_LOCALE[locale], alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]) };
}
