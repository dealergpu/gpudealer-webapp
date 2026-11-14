'use client';

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useCreateComputeRequest, ComputeWorkloadType, type ApiErrorResponse, type ComputeRequestInput } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { WORKLOAD_LABELS } from "@/lib/compute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const optional = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`);
const wholeNumber = (message: string) =>
  z.string().trim().refine((v) => v === "" || /^\d{1,15}$/.test(v.replace(/,/g, "")), message);

// Mirrors the API's rules for instant feedback; the API still validates.
const requestSchema = z.object({
  workloadType: z.nativeEnum(ComputeWorkloadType, { errorMap: () => ({ message: "Choose a workload" }) }),
  contactName: z.string().trim().min(1, "Name is required").max(100, "Keep it under 100 characters"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255),
  companyName: optional(255),
  gpuModel: optional(100),
  gpuCount: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 100_000), "Enter a number from 1 to 100,000"),
  modelNames: optional(2000),
  monthlyInputTokens: wholeNumber("Enter a whole number of tokens"),
  monthlyOutputTokens: wholeNumber("Enter a whole number of tokens"),
  monthlyBudget: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{1,14}(\.\d{1,2})?$/.test(v.replace(/,/g, "")), "Enter an amount, e.g. 25000"),
  region: optional(100),
  country: optional(100),
  requirements: optional(5000),
});

type RequestValues = z.infer<typeof requestSchema>;
type FieldName = keyof RequestValues;

const EMPTY: RequestValues = {
  workloadType: undefined as unknown as ComputeWorkloadType,
  contactName: "",
  email: "",
  companyName: "",
  gpuModel: "",
  gpuCount: "",
  modelNames: "",
  monthlyInputTokens: "",
  monthlyOutputTokens: "",
  monthlyBudget: "",
  region: "",
  country: "",
  requirements: "",
};

function toInput(values: RequestValues): ComputeRequestInput {
  const opt = (v: string) => v.trim() || undefined;
  const digits = (v: string) => opt(v.replace(/,/g, ""));
  const models = values.modelNames.split(",").map((m) => m.trim()).filter(Boolean).slice(0, 20);
  return {
    workloadType: values.workloadType,
    contactName: values.contactName.trim(),
    email: values.email.trim(),
    companyName: opt(values.companyName),
    gpuModel: opt(values.gpuModel),
    gpuCount: values.gpuCount ? Number(values.gpuCount) : undefined,
    modelNames: models.length ? models : undefined,
    monthlyInputTokens: digits(values.monthlyInputTokens),
    monthlyOutputTokens: digits(values.monthlyOutputTokens),
    monthlyBudget: digits(values.monthlyBudget),
    currency: "USD",
    region: opt(values.region),
    country: opt(values.country),
    requirements: opt(values.requirements),
  };
}

/**
 * "Tell us what compute you need". Sign-in is optional: when signed in, the
 * API client sends the session token and the request is linked to the
 * account. Prefilled from `?gpu=` / `?model=` links on the comparison pages.
 */
export function ComputeRequestForm({ defaults }: { defaults: { gpuModel?: string; modelName?: string } }) {
  const id = useId();
  const { user } = useAuth();
  const createRequest = useCreateComputeRequest();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { ...EMPTY, gpuModel: defaults.gpuModel ?? "", modelNames: defaults.modelName ?? "" },
  });
  const { errors } = form.formState;
  const workloadType = useWatch({ control: form.control, name: "workloadType" });

  useEffect(() => {
    if (user?.email && !form.getValues("email")) form.setValue("email", user.email);
  }, [user?.email, form]);

  const onSubmit = (values: RequestValues) => {
    setFormError(null);
    createRequest.mutate(
      { data: toInput(values) },
      {
        onSuccess: () => setSent(true),
        onError: (error) => {
          const body = (error.data as ApiErrorResponse | null)?.error;
          if (error.status === 429) {
            setFormError("You've sent a few requests in a row. Please wait a minute and try again.");
            return;
          }
          if (error.status === 400) {
            let matched = false;
            for (const [key, value] of Object.entries(body?.fields ?? {})) {
              const name = key.split(".")[0];
              if (name in EMPTY) {
                form.setError(name as FieldName, { message: Array.isArray(value) ? value.join(" ") : String(value) });
                matched = true;
              }
            }
            if (!matched) setFormError(body?.message ?? "Please check the form and try again.");
            return;
          }
          setFormError("We couldn't send your request. Please try again in a moment.");
        },
      },
    );
  };

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
        <p className="mt-4 font-display text-3xl">Request received.</p>
        <p className="mt-2 max-w-sm text-muted-foreground">Thanks — we&apos;ll review it and get back to you by email.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline"><Link href="/compute/gpu-cloud">GPU cloud prices</Link></Button>
          <Button asChild variant="outline"><Link href="/compute/inference">Inference prices</Link></Button>
        </div>
      </div>
    );
  }

  const field = (name: FieldName, label: string, input: ReactNode, opts: { required?: boolean; hint?: string } = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`${id}-${name}`} className={opts.required ? "font-semibold" : undefined}>
        {label}{" "}
        {opts.required ? <span className="text-destructive">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {input}
      {opts.hint && !errors[name] && <p className="text-xs text-muted-foreground">{opts.hint}</p>}
      {errors[name] && <p id={`${id}-${name}-error`} className="text-sm text-destructive">{errors[name]?.message}</p>}
    </div>
  );

  const inputProps = (name: Exclude<FieldName, "workloadType">) => ({
    id: `${id}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
    ...form.register(name),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-8 rounded-3xl border border-border bg-card p-6 md:p-8">
      <fieldset className="grid gap-5">
        <legend className="mb-4 text-sm font-semibold">What do you need?</legend>
        {field(
          "workloadType",
          "Workload",
          <Select
            value={workloadType ?? ""}
            onValueChange={(value) => form.setValue("workloadType", value as ComputeWorkloadType, { shouldValidate: true })}
          >
            <SelectTrigger
              id={`${id}-workloadType`}
              aria-invalid={errors.workloadType ? true : undefined}
              aria-describedby={errors.workloadType ? `${id}-workloadType-error` : undefined}
            >
              <SelectValue placeholder="Choose a workload" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WORKLOAD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>,
          { required: true },
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          {field("gpuModel", "GPU model", <Input placeholder="e.g. H100" maxLength={100} {...inputProps("gpuModel")} />)}
          {field("gpuCount", "Number of GPUs", <Input inputMode="numeric" placeholder="e.g. 8" {...inputProps("gpuCount")} />)}
        </div>
        {field(
          "modelNames",
          "Models",
          <Input placeholder="e.g. Llama 3.3 70B, Qwen 2.5 72B" {...inputProps("modelNames")} />,
          { hint: "Separate several models with commas." },
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          {field("monthlyInputTokens", "Input tokens / month", <Input inputMode="numeric" placeholder="e.g. 5000000000" {...inputProps("monthlyInputTokens")} />)}
          {field("monthlyOutputTokens", "Output tokens / month", <Input inputMode="numeric" placeholder="e.g. 1000000000" {...inputProps("monthlyOutputTokens")} />)}
          {field("monthlyBudget", "Monthly budget (USD)", <Input inputMode="decimal" placeholder="e.g. 25000" {...inputProps("monthlyBudget")} />)}
          {field("region", "Region", <Input placeholder="e.g. US, EU" maxLength={100} {...inputProps("region")} />)}
        </div>
        {field(
          "requirements",
          "Requirements",
          <Textarea rows={4} placeholder="Latency, SLA, contract length, compliance…" maxLength={5000} {...inputProps("requirements")} />,
        )}
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="mb-4 text-sm font-semibold">How do we reach you?</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("contactName", "Name", <Input autoComplete="name" maxLength={100} {...inputProps("contactName")} />, { required: true })}
          {field("email", "Email", <Input type="email" autoComplete="email" placeholder="you@company.com" {...inputProps("email")} />, { required: true })}
          {field("companyName", "Company", <Input autoComplete="organization" maxLength={255} {...inputProps("companyName")} />)}
          {field("country", "Country", <Input autoComplete="country-name" maxLength={100} {...inputProps("country")} />)}
        </div>
      </fieldset>

      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className={cn("flex flex-wrap items-center gap-4")}>
        <Button type="submit" size="lg" disabled={createRequest.isPending}>
          {createRequest.isPending ? "Sending..." : "Send request"}
        </Button>
        <p className="text-xs text-muted-foreground">We only use your details to reply about this request.</p>
      </div>
    </form>
  );
}
