import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Validated lazily (inside createClient, not at module load) so this module
// can be imported freely during Next's build/bundling even before Supabase
// credentials are configured.
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_PUBLISHABLE_KEY must be set. Copy .env.example to .env.local and fill in your Supabase project credentials.",
    );
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}

/**
 * Same as `createClient`, but returns null instead of throwing when
 * Supabase isn't configured — for call sites (auth pages, the auth context)
 * that need to render/build even before credentials are set up, and only
 * need to fail once someone actually tries to use the client.
 */
export function createClientSafely(): SupabaseClient | null {
  try {
    return createClient();
  } catch (error) {
    console.error(error);
    return null;
  }
}
