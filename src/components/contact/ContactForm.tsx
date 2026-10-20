'use client';

import { useEffect, useId, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useCreateContactMessage, ContactSubject, type ApiErrorResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SUBJECT_LABELS: Record<ContactSubject, string> = {
  [ContactSubject.PARTNERSHIP]: "Partnership",
  [ContactSubject.BUSINESS]: "Business inquiry",
  [ContactSubject.REPORT_BUG]: "Report a bug",
  [ContactSubject.FEEDBACK]: "Feedback",
  [ContactSubject.OTHER]: "Other",
};

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

// Mirrors the API's rules for instant feedback; the API still validates.
const contactSchema = z.object({
  name: z.string().trim().max(100, "Keep it under 100 characters"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255),
  phone: z.string().trim().max(50, "Keep it under 50 characters"),
  location: z.string().trim().max(255, "Keep it under 255 characters"),
  // Optional in the form; the API requires one, so it falls back to OTHER.
  subject: z.nativeEnum(ContactSubject).optional(),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .min(MESSAGE_MIN, `Please write at least ${MESSAGE_MIN} characters`)
    .max(MESSAGE_MAX, `Keep it under ${MESSAGE_MAX} characters`),
});

type ContactValues = z.infer<typeof contactSchema>;
type FieldName = keyof ContactValues;

const EMPTY: ContactValues = { name: "", email: "", phone: "", location: "", subject: undefined, message: "" };

export function ContactForm({ onDone, className }: { onDone?: () => void; className?: string }) {
  const id = useId();
  const { user } = useAuth();
  const createMessage = useCreateContactMessage();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<ContactValues>({ resolver: zodResolver(contactSchema), defaultValues: EMPTY });
  const { errors } = form.formState;
  const subject = useWatch({ control: form.control, name: "subject" });
  const messageLength = useWatch({ control: form.control, name: "message" })?.length ?? 0;

  // Signed-in users get their account email prefilled (still editable).
  useEffect(() => {
    if (user?.email && !form.getValues("email")) form.setValue("email", user.email);
  }, [user?.email, form]);

  const onSubmit = (values: ContactValues) => {
    setFormError(null);
    createMessage.mutate(
      { data: { ...values, subject: values.subject ?? ContactSubject.OTHER } },
      {
        onSuccess: () => {
          form.reset({ ...EMPTY, email: user?.email ?? "" });
          setSent(true);
        },
        onError: (error) => {
          const body = (error.data as ApiErrorResponse | null)?.error;
          if (error.status === 429) {
            setFormError("You've sent a few messages in a row. Please wait a minute and try again.");
            return;
          }
          if (error.status === 400) {
            let matched = false;
            for (const [key, value] of Object.entries(body?.fields ?? {})) {
              if (key in EMPTY) {
                form.setError(key as FieldName, { message: Array.isArray(value) ? value.join(" ") : String(value) });
                matched = true;
              }
            }
            if (!matched) setFormError(body?.message ?? "Please check the form and try again.");
            return;
          }
          setFormError("We couldn't send your message. Please try again in a moment.");
        },
      },
    );
  };

  if (sent) {
    return (
      <div role="status" className={cn("flex flex-col items-center py-8 text-center", className)}>
        <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
        <p className="mt-4 font-display text-3xl">Message sent.</p>
        <p className="mt-2 max-w-sm text-muted-foreground">Thanks for reaching out — we&apos;ll get back to you by email.</p>
        <Button variant="outline" className="mt-6" onClick={onDone ?? (() => setSent(false))}>
          {onDone ? "Close" : "Send another message"}
        </Button>
      </div>
    );
  }

  const field = (name: FieldName, label: string, input: ReactNode, required = false) => (
    <div className="space-y-2">
      <Label htmlFor={`${id}-${name}`} className={required ? "font-semibold" : undefined}>
        {label} {required ? <span className="text-destructive">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {input}
      {errors[name] && (
        <p id={`${id}-${name}-error`} className="text-sm text-destructive">{errors[name]?.message}</p>
      )}
    </div>
  );

  const inputProps = (name: Exclude<FieldName, "subject">) => ({
    id: `${id}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
    ...form.register(name),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className={cn("grid gap-5", className)}>
      <div className="grid gap-5 sm:grid-cols-2">
        {field("email", "Email", <Input type="email" autoComplete="email" placeholder="you@company.com" {...inputProps("email")} />, true)}
        {field("name", "Name", <Input autoComplete="name" maxLength={100} {...inputProps("name")} />)}
        {field("phone", "Phone", <Input type="tel" autoComplete="tel" maxLength={50} {...inputProps("phone")} />)}
        {field("location", "Location", <Input placeholder="e.g. Toronto, ON" maxLength={255} {...inputProps("location")} />)}
      </div>

      {field(
        "subject",
        "Subject",
        <Select
          value={subject ?? ""}
          onValueChange={(value) => form.setValue("subject", value as ContactSubject, { shouldDirty: true })}
        >
          <SelectTrigger id={`${id}-subject`}>
            <SelectValue placeholder="Choose a topic" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={`${id}-message`} className="font-semibold">
            Message <span className="text-destructive">*</span>
          </Label>
          <span className={cn("font-mono text-[11px] tabular-nums", messageLength > MESSAGE_MAX ? "text-destructive" : "text-muted-foreground")}>
            {messageLength}/{MESSAGE_MAX}
          </span>
        </div>
        <Textarea rows={5} placeholder="How can we help?" {...inputProps("message")} />
        {errors.message && (
          <p id={`${id}-message-error`} className="text-sm text-destructive">{errors.message.message}</p>
        )}
      </div>

      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={createMessage.isPending} className="justify-self-start">
        {createMessage.isPending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
