/**
 * Locale configuration shared by middleware, Server and Client Components.
 *
 * English is the default and lives at the unprefixed URLs (`/gpus`); every
 * other locale gets a path prefix (`/zh/gpus`). Each language version has its
 * own URL so search engines can index both (see `alternatesFor()`).
 */
export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Remembers an explicit language choice; also stops the China-IP auto-redirect. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** `<html lang>` and hreflang values. */
export const HTML_LANG: Record<Locale, string> = { en: "en", zh: "zh-CN" };

/** Open Graph `og:locale` values. */
export const OG_LOCALE: Record<Locale, string> = { en: "en_US", zh: "zh_CN" };

/** BCP 47 tag for Intl date/number formatting. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-US", zh: "zh-CN" };

/** Names shown in the language switcher, always in their own language. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", zh: "简体中文" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

const PREFIXED = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

/** The locale prefix a path starts with (`/zh`, `/zh/gpus`), if any. */
function prefixOf(path: string): Locale | null {
  for (const locale of LOCALES) {
    if (path === `/${locale}` || path.startsWith(`/${locale}/`) || path.startsWith(`/${locale}?`) || path.startsWith(`/${locale}#`)) {
      return locale;
    }
  }
  return null;
}

/**
 * Splits `/zh/gpus?q=1` into `{ locale: "zh", path: "/gpus?q=1" }`. Paths
 * without a prefix are the default locale.
 */
export function splitLocale(path: string): { locale: Locale; path: string } {
  const locale = prefixOf(path);
  if (!locale) return { locale: DEFAULT_LOCALE, path };
  const rest = path.slice(locale.length + 1);
  return { locale, path: rest === "" || rest[0] !== "/" ? `/${rest}` : rest };
}

/**
 * Adds the locale prefix to an internal path: `("/gpus", "zh")` → `/zh/gpus`.
 * Leaves alone anything that isn't a same-site path (`https://…`, `#hash`,
 * `mailto:`) or already carries a locale prefix, so it's safe to apply twice.
 */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith("/") || path.startsWith("//") || prefixOf(path)) return path;
  if (!(PREFIXED as readonly string[]).includes(locale)) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Like `localizePath`, but first removes any existing prefix — used by the
 * language switcher to move the current page to another locale.
 */
export function switchLocalePath(path: string, locale: Locale): string {
  return localizePath(splitLocale(path).path, locale);
}
