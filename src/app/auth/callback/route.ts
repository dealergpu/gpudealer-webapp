import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth-redirect";
import { localizePath, splitLocale } from "@/i18n/config";

// Exchanges the OAuth `code` Supabase redirects back with for a session,
// setting the auth cookies before sending the user on to their destination.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Back to sign-in in the language the user started from.
  return NextResponse.redirect(`${origin}${localizePath("/sign-in?error=oauth", splitLocale(next).locale)}`);
}
