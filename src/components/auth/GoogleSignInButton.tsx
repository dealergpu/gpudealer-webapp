"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

export function GoogleSignInButton({
  supabase,
  next = "/dashboard",
}: {
  supabase: SupabaseClient | null;
  next?: string;
}) {
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const onClick = async () => {
    if (!supabase) {
      toast({ title: "Sign in unavailable", description: "Authentication isn't configured yet.", variant: "destructive" });
      return;
    }
    setIsRedirecting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setIsRedirecting(false);
      toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
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
      Continue with Google
    </Button>
  );
}
