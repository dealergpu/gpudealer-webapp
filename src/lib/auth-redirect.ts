const DEFAULT_AFTER_SIGN_IN = "/dashboard";

/**
 * A `?next=` value that is safe to redirect to after sign-in: a same-site
 * path only. Anything else (absolute URLs, `//host`, `\\host`, `@host`
 * tricks) falls back to the dashboard, so the param can't be used as an
 * open redirect.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_AFTER_SIGN_IN;
  }
  return next;
}

/** Sign-in URL that sends the user back to `returnTo` afterwards. */
export function signInPath(returnTo: string): string {
  return `/sign-in?next=${encodeURIComponent(returnTo)}`;
}
