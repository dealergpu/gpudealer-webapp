import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, splitLocale } from "@/i18n/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY;

/**
 * Visitors from these countries (Cloudflare's `CF-IPCountry`) who haven't
 * picked a language are sent to the Chinese site on their first page view.
 * Everyone else — and anyone without a country header — gets English.
 */
const CHINESE_COUNTRIES = new Set(["CN"]);

// Crawlers must see each URL's own language, never an IP-based redirect, or
// the English pages can't be indexed from a crawler with a Chinese IP.
const BOT_PATTERN = /bot|crawl|spider|slurp|baidu|sogou|360spider|yisou|bytespider|yandex|facebookexternalhit|preview|lighthouse/i;

// Served from the app root, outside the `[lang]` segment.
const UNLOCALIZED_PREFIXES = ["/auth/", "/opengraph-image", "/_next/"];

function isUnlocalized(pathname: string): boolean {
  // Any path whose last segment has an extension is a file, not a page.
  return UNLOCALIZED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || /\.[a-z0-9]+$/i.test(pathname);
}

function prefersChinese(request: NextRequest): boolean {
  const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen === "zh";
  if (BOT_PATTERN.test(request.headers.get("user-agent") ?? "")) return false;
  const country = request.headers.get("cf-ipcountry")?.toUpperCase();
  return country ? CHINESE_COUNTRIES.has(country) : false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let rewriteTo: URL | null = null;

  if (!isUnlocalized(pathname)) {
    const { locale, path } = splitLocale(pathname);
    const hasPrefix = path !== pathname;

    // `/en/...` is never a public URL: English lives at the unprefixed path.
    if (hasPrefix && locale === DEFAULT_LOCALE) {
      const url = request.nextUrl.clone();
      url.pathname = path;
      return NextResponse.redirect(url, 308);
    }

    if (!hasPrefix) {
      if (prefersChinese(request)) {
        const url = request.nextUrl.clone();
        url.pathname = pathname === "/" ? "/zh" : `/zh${pathname}`;
        const response = NextResponse.redirect(url, 307);
        // Depends on the visitor's IP/cookie — must never be cached and shared.
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }
      // English: serve the unprefixed URL from the `[lang]` segment.
      rewriteTo = request.nextUrl.clone();
      rewriteTo.pathname = pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;
    }
  }

  const passThrough = () =>
    rewriteTo ? NextResponse.rewrite(rewriteTo, { request }) : NextResponse.next({ request });

  let response = passThrough();

  if (!supabaseUrl || !supabasePublishableKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = passThrough();
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refreshes the session cookie if it's expired. Required reading (not just
  // discarding the result) is what triggers the refresh.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt)$).*)",
  ],
};
