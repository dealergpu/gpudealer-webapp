'use client';

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import { localizePath } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { createClientSafely } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AuthShell } from "@/components/auth/AuthShell";
import { currentNextPath, keepNextParam } from "@/lib/auth-redirect";

const makePasswordSchema = (a: Messages["auth"]) => z.object({
  email: z.string().email(a.emailInvalid),
  password: z.string().min(1, a.passwordRequired),
});

const makeMagicLinkSchema = (a: Messages["auth"]) => z.object({
  email: z.string().email(a.emailInvalid),
});

type PasswordFormValues = z.infer<ReturnType<typeof makePasswordSchema>>;
type MagicLinkFormValues = z.infer<ReturnType<typeof makeMagicLinkSchema>>;

export default function SignIn() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const a = t.auth;
  const { toast } = useToast();
  const [supabase] = useState(createClientSafely);
  const [mode, setMode] = useState<"google" | "password" | "magic-link">("google");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(makePasswordSchema(a)),
    defaultValues: { email: "", password: "" },
  });

  const magicLinkForm = useForm<MagicLinkFormValues>({
    resolver: zodResolver(makeMagicLinkSchema(a)),
    defaultValues: { email: "" },
  });

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    if (!supabase) {
      toast({ title: a.signInUnavailable, description: a.notConfigured, variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setIsSubmitting(false);
    if (error) {
      toast({ title: a.signInFailed, description: error.message, variant: "destructive" });
      return;
    }
    router.push(currentNextPath());
    router.refresh();
  };

  const onMagicLinkSubmit = async (values: MagicLinkFormValues) => {
    if (!supabase) {
      toast({ title: a.signInUnavailable, description: a.notConfigured, variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { emailRedirectTo: `${window.location.origin}${localizePath(currentNextPath(), locale)}` },
    });
    setIsSubmitting(false);
    if (error) {
      toast({ title: a.magicLinkFailed, description: error.message, variant: "destructive" });
      return;
    }
    setMagicLinkSent(true);
  };

  return (
    <AuthShell title={<>{a.welcomeStart} <em>{a.welcomeEm}</em></>} description={a.signInDescription}>
      {mode === "google" ? (
        <div className="space-y-4">
          <GoogleSignInButton supabase={supabase} />
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode("password")}
          >
            {a.useEmailPassword}
          </button>
        </div>
      ) : (
        <>
          {mode === "password" ? (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{a.email}</Label>
                <Input id="email" type="email" autoComplete="email" {...passwordForm.register("email")} />
                {passwordForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{a.password}</Label>
                <Input id="password" type="password" autoComplete="current-password" {...passwordForm.register("password")} />
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button variant="accent" type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="mr-2" /> : null}
                {a.signIn}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMode("magic-link")}
              >
                {a.useMagicLink}
              </button>
            </form>
          ) : magicLinkSent ? (
            <p className="text-sm text-muted-foreground">
              {a.checkEmailMagic}
            </p>
          ) : (
            <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">{a.email}</Label>
                <Input id="magic-email" type="email" autoComplete="email" {...magicLinkForm.register("email")} />
                {magicLinkForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{magicLinkForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button variant="accent" type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="mr-2" /> : null}
                {a.sendMagicLink}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMode("password")}
              >
                {a.usePassword}
              </button>
            </form>
          )}
          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode("google")}
          >
            {a.backToGoogleSignIn}
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {a.noAccount}{" "}
        <Link href="/sign-up" onClick={keepNextParam(router, "/sign-up")} className="font-semibold text-accent hover:text-accent/80">
          {a.signUp}
        </Link>
      </p>
    </AuthShell>
  );
}
