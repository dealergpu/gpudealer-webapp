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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { createClientSafely } from "@/lib/supabase/client";

const passwordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const magicLinkSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;
type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

export default function SignIn() {
  const router = useRouter();
  const { toast } = useToast();
  const [supabase] = useState(createClientSafely);
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
  });

  const magicLinkForm = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    if (!supabase) {
      toast({ title: "Sign in unavailable", description: "Authentication isn't configured yet.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setIsSubmitting(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const onMagicLinkSubmit = async (values: MagicLinkFormValues) => {
    if (!supabase) {
      toast({ title: "Sign in unavailable", description: "Authentication isn't configured yet.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setIsSubmitting(false);
    if (error) {
      toast({ title: "Couldn't send magic link", description: error.message, variant: "destructive" });
      return;
    }
    setMagicLinkSent(true);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <Card className="w-[440px] max-w-full">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "password" ? (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...passwordForm.register("email")} />
                {passwordForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" {...passwordForm.register("password")} />
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="mr-2" /> : null}
                Sign In
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMode("magic-link")}
              >
                Use a magic link instead
              </button>
            </form>
          ) : magicLinkSent ? (
            <p className="text-sm text-muted-foreground">
              Check your email for a link to sign in.
            </p>
          ) : (
            <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input id="magic-email" type="email" autoComplete="email" {...magicLinkForm.register("email")} />
                {magicLinkForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{magicLinkForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="mr-2" /> : null}
                Send Magic Link
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMode("password")}
              >
                Use a password instead
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/sign-up" className="font-semibold text-accent hover:text-accent/80">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
