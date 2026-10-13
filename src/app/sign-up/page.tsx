'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const signUpSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const router = useRouter();
  const { toast } = useToast();
  const [supabase] = useState(createClientSafely);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    if (!supabase) {
      toast({ title: "Sign up unavailable", description: "Authentication isn't configured yet.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }

    // A session is returned immediately when email confirmation is disabled;
    // otherwise the user needs to confirm their email before signing in.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSubmitted(true);
  };

  return (
    <AuthShell title={<>Create your <em>account.</em></>} description="Join GPUDealer to sell hardware and request what you can't find.">
      {submitted ? (
        <p className="text-sm text-muted-foreground">
          Check your email to confirm your account, then sign in.
        </p>
      ) : !showEmailForm ? (
        <div className="space-y-4">
          <GoogleSignInButton supabase={supabase} />
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowEmailForm(true)}
          >
            Use email and password instead
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button variant="accent" type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2" /> : null}
              Create Account
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowEmailForm(false)}
          >
            &larr; Back to Google sign up
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-accent hover:text-accent/80">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
