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
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

// Mirrors the API's rules for instant feedback; the API still validates.
const makeContactSchema = (v: Messages["validation"]) => z.object({
  name: z.string().trim().max(100, fmt(v.maxChars, { max: 100 })),
  email: z.string().trim().min(1, v.emailRequired).email(v.emailInvalid).max(255),
  phone: z.string().trim().max(50, fmt(v.maxChars, { max: 50 })),
  location: z.string().trim().max(255, fmt(v.maxChars, { max: 255 })),
  // Optional in the form; the API requires one, so it falls back to OTHER.
  subject: z.nativeEnum(ContactSubject).optional(),
  message: z
    .string()
    .trim()
    .min(1, v.messageRequired)
    .min(MESSAGE_MIN, fmt(v.minChars, { min: MESSAGE_MIN }))
    .max(MESSAGE_MAX, fmt(v.maxChars, { max: MESSAGE_MAX })),
});

type ContactValues = z.infer<ReturnType<typeof makeContactSchema>>;
type FieldName = keyof ContactValues;

const EMPTY: ContactValues = { name: "", email: "", phone: "", location: "", subject: undefined, message: "" };

export function ContactForm({ onDone, className }: { onDone?: () => void; className?: string }) {
  const id = useId();
  const { t } = useI18n();
  const c = t.contact;
  const [contactSchema] = useState(() => makeContactSchema(t.validation));
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
            setFormError(c.rateLimited);
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
            if (!matched) setFormError(body?.message ?? c.checkForm);
            return;
          }
          setFormError(c.sendFailed);
        },
      },
    );
  };

  if (sent) {
    return (
      <div role="status" className={cn("flex flex-col items-center py-8 text-center", className)}>
        <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
        <p className="mt-4 font-display text-3xl">{c.sentTitle}</p>
        <p className="mt-2 max-w-sm text-muted-foreground">{c.sentBody}</p>
        <Button variant="outline" className="mt-6" onClick={onDone ?? (() => setSent(false))}>
          {onDone ? t.common.close : c.sendAnother}
        </Button>
      </div>
    );
  }

  const field = (name: FieldName, label: string, input: ReactNode, required = false) => (
    <div className="space-y-2">
      <Label htmlFor={`${id}-${name}`} className={required ? "font-semibold" : undefined}>
        {label} {required ? <span className="text-destructive">*</span> : <span className="font-normal text-muted-foreground">{t.common.optional}</span>}
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
        {field("email", c.email, <Input type="email" autoComplete="email" placeholder="you@company.com" {...inputProps("email")} />, true)}
        {field("name", c.name, <Input autoComplete="name" maxLength={100} {...inputProps("name")} />)}
        {field("phone", c.phone, <Input type="tel" autoComplete="tel" maxLength={50} {...inputProps("phone")} />)}
        {field("location", c.location, <Input placeholder={c.locationPlaceholder} maxLength={255} {...inputProps("location")} />)}
      </div>

      {field(
        "subject",
        c.subject,
        <Select
          value={subject ?? ""}
          onValueChange={(value) => form.setValue("subject", value as ContactSubject, { shouldDirty: true })}
        >
          <SelectTrigger id={`${id}-subject`}>
            <SelectValue placeholder={c.subjectPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ContactSubject).map((value) => (
              [value, c.subjects[value]] as const
            )).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={`${id}-message`} className="font-semibold">
            {c.message} <span className="text-destructive">*</span>
          </Label>
          <span className={cn("font-mono text-[11px] tabular-nums", messageLength > MESSAGE_MAX ? "text-destructive" : "text-muted-foreground")}>
            {messageLength}/{MESSAGE_MAX}
          </span>
        </div>
        <Textarea rows={5} placeholder={c.messagePlaceholder} {...inputProps("message")} />
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
        {createMessage.isPending ? c.sending : c.send}
      </Button>
    </form>
  );
}
