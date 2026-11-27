'use client';

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { HTML_LANG, LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALE_NAMES, switchLocalePath, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Stores the choice so the China-IP redirect in middleware never overrides it. */
function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * Links to the current page in the other language(s). `compact` shows only
 * the other language(s), for the navbar. Real `<a hreflang>`
 * links, so crawlers can follow them too; a click also remembers the choice
 * and keeps the query string and hash.
 */
export function LanguageSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  // Plain Next router: the target is already a fully localized path.
  const router = useRouter();

  const onSwitch = (target: Locale) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    rememberLocale(target);
    // A different `[lang]` segment re-renders the whole tree, <html lang> included.
    router.push(`${switchLocalePath(pathname, target)}${window.location.search}${window.location.hash}`);
  };

  return (
    <div className={cn("flex items-center gap-1", className)} role="group" aria-label={t.language.label}>
      {!compact && <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />}
      {LOCALES.filter((target) => !compact || target !== locale).map((target) =>
        target === locale ? (
          <span key={target} lang={HTML_LANG[target]} aria-current="true" className="rounded-full px-2 py-1 text-xs font-medium text-foreground">
            {LOCALE_NAMES[target]}
          </span>
        ) : (
          <a
            key={target}
            href={switchLocalePath(pathname, target)}
            hrefLang={HTML_LANG[target]}
            lang={HTML_LANG[target]}
            onClick={onSwitch(target)}
            title={fmt(t.language.switchTo, { language: LOCALE_NAMES[target] })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
              compact && "px-3 py-2 text-sm",
            )}
          >
            {compact && <Languages className="h-4 w-4" aria-hidden />}
            {LOCALE_NAMES[target]}
          </a>
        ),
      )}
    </div>
  );
}
