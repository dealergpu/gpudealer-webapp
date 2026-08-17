import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_PUBLISHABLE_KEY must be set. Copy .env.example to .env.local and fill in your Supabase project credentials.",
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}

/**
 * Server Component / Route Handler client. Reads the session from cookies.
 * Writing cookies here only works in Route Handlers and Server Actions —
 * Server Components can call `getAll`/read but any `setAll` call is a no-op
 * there (guarded below), which is fine since `src/middleware.ts` is what
 * actually keeps the session cookie refreshed on navigation.
 *
 * Env vars are validated lazily (here, not at module load) so this module
 * can be imported freely during Next's build-time page-data collection even
 * before Supabase credentials are configured.
 */
export async function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — middleware handles the refresh.
        }
      },
    },
  });
}

/**
 * Returns the current user, or null if there's no session — including when
 * Supabase isn't configured yet, so protected pages degrade to redirecting
 * to sign-in rather than crashing.
 */
export async function getUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
}
