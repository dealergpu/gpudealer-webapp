'use client';

import { forwardRef, useMemo, type ComponentProps } from "react";
import NextLink from "next/link";
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation";
import { localizePath, splitLocale } from "./config";
import { useLocale } from "./client";

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * `next/link` that keeps the visitor in their language: internal paths get
 * the current locale prefix (`/gpus` → `/zh/gpus` on the Chinese site).
 * External URLs and already-prefixed paths pass through unchanged.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, ...props }, ref) {
  const locale = useLocale();
  const localized =
    typeof href === "string"
      ? localizePath(href, locale)
      : href.pathname
        ? { ...href, pathname: localizePath(href.pathname, locale) }
        : href;
  return <NextLink ref={ref} href={localized} {...props} />;
});

/** `useRouter()` whose push/replace/prefetch localize internal paths. */
export function useRouter() {
  const router = useNextRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) => router.push(localizePath(href, locale), options),
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) => router.replace(localizePath(href, locale), options),
      prefetch: (href: string, options?: Parameters<typeof router.prefetch>[1]) => router.prefetch(localizePath(href, locale), options),
    }),
    [router, locale],
  );
}

/**
 * The current path **without** its locale prefix (`/zh/gpus` → `/gpus`), so
 * active-link checks and `?next=` return paths work the same in every
 * language. Pass it through `Link`/`useRouter` to get back to the localized URL.
 */
export function usePathname(): string {
  return splitLocale(useNextPathname() ?? "/").path;
}
