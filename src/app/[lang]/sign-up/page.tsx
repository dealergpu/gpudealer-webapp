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

const makeSignUpSchema = (a: Messages["auth"]) => z
  .object({
    email: z.string().email(a.emailInvalid),
    password: z.string().min(8, a.passwordMin),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: a.passwordsMismatch,
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<ReturnType<typeof makeSignUpSchema>>;

export default function SignUp() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const a = t.auth;
  const { toast } = useToast();
  const [supabase] = useState(createClientSafely);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(makeSignUpSchema(a)),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    if (!supabase) {
      toast({ title: a.signUpUnavailable, description: a.notConfigured, variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: `${window.location.origin}${localizePath(currentNextPath(), locale)}` },
    });
    setIsSubmitting(false);

    if (error) {
      toast({ title: a.signUpFailed, description: error.message, variant: "destructive" });
      return;
    }

    // A session is returned immediately when email confirmation is disabled;
    // otherwise the user needs to confirm their email before signing in.
    if (data.session) {
      router.push(currentNextPath());
      router.refresh();
      return;
    }

    setSubmitted(true);
  };

  return (
    <AuthShell title={<>{a.createStart} <em>{a.createEm}</em></>} description={a.signUpDescription}>
      {submitted ? (
        <p className="text-sm text-muted-foreground">
          {a.checkEmailConfirm}
        </p>
      ) : !showEmailForm ? (
        <div className="space-y-4">
          <GoogleSignInButton supabase={supabase} />
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowEmailForm(true)}
          >
            {a.useEmailPassword}
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{a.email}</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{a.password}</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{a.confirmPassword}</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button variant="accent" type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2" /> : null}
              {a.createAccount}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowEmailForm(false)}
          >
            {a.backToGoogleSignUp}
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {a.haveAccount}{" "}
        <Link href="/sign-in" onClick={keepNextParam(router, "/sign-in")} className="font-semibold text-accent hover:text-accent/80">
          {a.signInLink}
        </Link>
      </p>
    </AuthShell>
  );
}
