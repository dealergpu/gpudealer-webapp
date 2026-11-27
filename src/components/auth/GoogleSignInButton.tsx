"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { currentNextPath } from "@/lib/auth-redirect";
import { useI18n } from "@/i18n/client";
import { localizePath } from "@/i18n/config";

export function GoogleSignInButton({
  supabase,
  next,
}: {
  supabase: SupabaseClient | null;
  /** Where to land after sign-in. Defaults to the page's own `?next=` param, else the dashboard. */
  next?: string;
}) {
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const onClick = async () => {
    if (!supabase) {
      toast({ title: t.auth.signInUnavailable, description: t.auth.notConfigured, variant: "destructive" });
      return;
    }
    setIsRedirecting(true);
    // The callback redirects to this path as-is, so it carries the locale prefix.
    const target = localizePath(next ?? currentNextPath(), locale);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
      },
    });
    if (error) {
      setIsRedirecting(false);
      toast({ title: t.auth.googleFailed, description: error.message, variant: "destructive" });
    }
    // On success the browser is redirected to Google, so no further state change is needed here.
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={onClick}
      disabled={isRedirecting}
    >
      {isRedirecting ? <Spinner className="mr-1" /> : <FcGoogle className="h-5 w-5" />}
      {t.auth.continueWithGoogle}
    </Button>
  );
}
