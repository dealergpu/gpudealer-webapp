'use client';

import { useEffect, useId, useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useCreateComputeRequest, ComputeWorkloadType, type ApiErrorResponse, type ComputeRequestInput } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Mirrors the API's rules for instant feedback; the API still validates.
const makeRequestSchema = (t: Messages) => {
  const r = t.computeRequest;
  const v = t.validation;
  const optional = (max: number) => z.string().trim().max(max, fmt(v.maxChars, { max }));
  const wholeNumber = (message: string) =>
    z.string().trim().refine((value) => value === "" || /^\d{1,15}$/.test(value.replace(/,/g, "")), message);
  return z.object({
  workloadType: z.nativeEnum(ComputeWorkloadType, { errorMap: () => ({ message: r.chooseWorkload }) }),
  contactName: z.string().trim().min(1, r.nameRequired).max(100, fmt(v.maxChars, { max: 100 })),
  email: z.string().trim().min(1, v.emailRequired).email(v.emailInvalid).max(255),
  companyName: optional(255),
  gpuModel: optional(100),
  gpuCount: z
    .string()
    .trim()
    .refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 100_000), r.gpuCountRange),
  modelNames: optional(2000),
  monthlyInputTokens: wholeNumber(r.wholeTokens),
  monthlyOutputTokens: wholeNumber(r.wholeTokens),
  monthlyBudget: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{1,14}(\.\d{1,2})?$/.test(value.replace(/,/g, "")), r.amountInvalid),
  region: optional(100),
  country: optional(100),
  requirements: optional(5000),
  });
};

type RequestValues = z.infer<ReturnType<typeof makeRequestSchema>>;
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
  const { t } = useI18n();
  const r = t.computeRequest;
  const [requestSchema] = useState(() => makeRequestSchema(t));
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
            setFormError(r.rateLimited);
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
            if (!matched) setFormError(body?.message ?? t.contact.checkForm);
            return;
          }
          setFormError(r.sendFailed);
        },
      },
    );
  };

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
        <p className="mt-4 font-display text-3xl">{r.receivedTitle}</p>
        <p className="mt-2 max-w-sm text-muted-foreground">{r.receivedBody}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline"><Link href="/compute/gpu-cloud">{r.gpuCloudPrices}</Link></Button>
          <Button asChild variant="outline"><Link href="/compute/inference">{r.inferencePrices}</Link></Button>
        </div>
      </div>
    );
  }

  const field = (name: FieldName, label: string, input: ReactNode, opts: { required?: boolean; hint?: string } = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`${id}-${name}`} className={opts.required ? "font-semibold" : undefined}>
        {label}{" "}
        {opts.required ? <span className="text-destructive">*</span> : <span className="font-normal text-muted-foreground">{t.common.optional}</span>}
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
        <legend className="mb-4 text-sm font-semibold">{r.whatNeed}</legend>
        {field(
          "workloadType",
          r.workload,
          <Select
            value={workloadType ?? ""}
            onValueChange={(value) => form.setValue("workloadType", value as ComputeWorkloadType, { shouldValidate: true })}
          >
            <SelectTrigger
              id={`${id}-workloadType`}
              aria-invalid={errors.workloadType ? true : undefined}
              aria-describedby={errors.workloadType ? `${id}-workloadType-error` : undefined}
            >
              <SelectValue placeholder={r.chooseWorkload} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(t.computeLabels.workloads).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>,
          { required: true },
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          {field("gpuModel", r.gpuModel, <Input placeholder={r.gpuModelPlaceholder} maxLength={100} {...inputProps("gpuModel")} />)}
          {field("gpuCount", r.gpuCount, <Input inputMode="numeric" placeholder={r.gpuCountPlaceholder} {...inputProps("gpuCount")} />)}
        </div>
        {field(
          "modelNames",
          r.models,
          <Input placeholder={r.modelsPlaceholder} {...inputProps("modelNames")} />,
          { hint: r.modelsHint },
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          {field("monthlyInputTokens", r.inputTokens, <Input inputMode="numeric" placeholder="e.g. 5000000000" {...inputProps("monthlyInputTokens")} />)}
          {field("monthlyOutputTokens", r.outputTokens, <Input inputMode="numeric" placeholder="e.g. 1000000000" {...inputProps("monthlyOutputTokens")} />)}
          {field("monthlyBudget", r.budget, <Input inputMode="decimal" placeholder="e.g. 25000" {...inputProps("monthlyBudget")} />)}
          {field("region", r.region, <Input placeholder={r.regionPlaceholder} maxLength={100} {...inputProps("region")} />)}
        </div>
        {field(
          "requirements",
          r.requirements,
          <Textarea rows={4} placeholder={r.requirementsPlaceholder} maxLength={5000} {...inputProps("requirements")} />,
        )}
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="mb-4 text-sm font-semibold">{r.reachYou}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("contactName", r.name, <Input autoComplete="name" maxLength={100} {...inputProps("contactName")} />, { required: true })}
          {field("email", r.email, <Input type="email" autoComplete="email" placeholder="you@company.com" {...inputProps("email")} />, { required: true })}
          {field("companyName", r.company, <Input autoComplete="organization" maxLength={255} {...inputProps("companyName")} />)}
          {field("country", r.country, <Input autoComplete="country-name" maxLength={100} {...inputProps("country")} />)}
        </div>
      </fieldset>

      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className={cn("flex flex-wrap items-center gap-4")}>
        <Button type="submit" size="lg" disabled={createRequest.isPending}>
          {createRequest.isPending ? r.sending : r.send}
        </Button>
        <p className="text-xs text-muted-foreground">{r.privacy}</p>
      </div>
    </form>
  );
}
