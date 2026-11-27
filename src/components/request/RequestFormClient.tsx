'use client';

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateRequest, ListingCategory, ListingCondition, getGetRequestsQueryKey } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/layout/PageHeader";

const makeRequestSchema = (m: Messages["requestForm"]) => z.object({
  title: z.string().min(5, m.titleRequired),
  category: z.nativeEnum(ListingCategory),
  requestedModel: z.string().min(3, m.modelRequired),
  quantity: z.coerce.number().min(1, m.quantityMin),
  minVramGb: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  maxBudgetPerUnit: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  conditionPreference: z.nativeEnum(ListingCondition),
  destinationCountry: z.string().optional(),
  destinationCity: z.string().optional(),
  description: z.string().optional(),
});

type RequestFormValues = z.infer<ReturnType<typeof makeRequestSchema>>;

export function RequestFormClient() {
  const router = useRouter();
  const { t } = useI18n();
  const m = t.requestForm;
  const [requestSchema] = useState(() => makeRequestSchema(m));
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createRequest = useCreateRequest();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      category: ListingCategory.GPU,
      quantity: 1,
      conditionPreference: ListingCondition.UNKNOWN,
    },
  });
  const category = useWatch({ control: form.control, name: "category" });
  const conditionPreference = useWatch({ control: form.control, name: "conditionPreference" });

  const onSubmit = (data: RequestFormValues) => {
    createRequest.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey() });
          toast({
            title: m.submittedTitle,
            description: m.submittedBody,
          });
          router.push("/dashboard");
        },
        onError: () => {
          toast({
            title: m.errorTitle,
            description: m.submitFailed,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <>
      <PageHeader
        eyebrow={m.eyebrow}
        title={<>{m.titleStart} <em>{m.titleEm}</em></>}
        description={m.description}
      />
      <div className="container mx-auto max-w-3xl px-4 py-12">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="overflow-hidden border-border mb-8">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>{m.requirements}</CardTitle>
            <CardDescription>{m.requirementsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold">{m.requestTitle} <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder={m.requestTitlePlaceholder}
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedModel" className="font-semibold">{m.targetModel} <span className="text-destructive">*</span></Label>
              <Input
                id="requestedModel"
                placeholder={m.targetModelPlaceholder}
                {...form.register("requestedModel")}
              />
              {form.formState.errors.requestedModel && (
                <p className="text-sm text-destructive">{form.formState.errors.requestedModel.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="font-semibold">{m.category} <span className="text-destructive">*</span></Label>
                <Select
                  value={category}
                  onValueChange={(val) => form.setValue("category", val as ListingCategory)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t.categoryOptions.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ListingCategory.GPU}>{t.categoryOptions.GPU}</SelectItem>
                    <SelectItem value={ListingCategory.SERVER}>{t.categoryOptions.SERVER}</SelectItem>
                    <SelectItem value={ListingCategory.MEMORY}>{t.categoryOptions.MEMORY}</SelectItem>
                    <SelectItem value={ListingCategory.OTHER}>{t.categoryOptions.OTHER}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="font-semibold">{m.quantity} <span className="text-destructive">*</span></Label>
                <Input
                  id="quantity"
                  type="number"
                  {...form.register("quantity")}
                />
                {form.formState.errors.quantity && (
                  <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minVramGb">{m.minVram} <span className="text-muted-foreground font-normal text-xs ml-1">{t.common.optional}</span></Label>
                <Input
                  id="minVramGb"
                  type="number"
                  placeholder={m.minVramPlaceholder}
                  {...form.register("minVramGb")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditionPreference" className="font-semibold">{m.conditionPreference} <span className="text-destructive">*</span></Label>
                <Select
                  value={conditionPreference}
                  onValueChange={(val) => form.setValue("conditionPreference", val as ListingCondition)}
                >
                  <SelectTrigger id="conditionPreference">
                    <SelectValue placeholder={m.conditionPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ListingCondition.UNKNOWN}>{m.noPreference}</SelectItem>
                    <SelectItem value={ListingCondition.NEW}>{m.newOnly}</SelectItem>
                    <SelectItem value={ListingCondition.USED}>{m.usedOk}</SelectItem>
                    <SelectItem value={ListingCondition.REFURBISHED}>{m.refurbishedOk}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border mb-8">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>{m.logistics}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maxBudgetPerUnit">{m.budget} <span className="text-muted-foreground font-normal text-xs ml-1">{t.common.optional}</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="maxBudgetPerUnit"
                    type="number"
                    className="pl-7 font-mono"
                    placeholder="0.00"
                    {...form.register("maxBudgetPerUnit")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationCity">{m.destinationCity} <span className="text-muted-foreground font-normal text-xs ml-1">{t.common.optional}</span></Label>
                <Input
                  id="destinationCity"
                  placeholder={m.destinationCityPlaceholder}
                  {...form.register("destinationCity")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="destinationCountry">{m.destinationCountry} <span className="text-muted-foreground font-normal text-xs ml-1">{t.common.optional}</span></Label>
                <Input
                  id="destinationCountry"
                  placeholder={m.destinationCountryPlaceholder}
                  {...form.register("destinationCountry")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{m.notes}</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder={m.notesPlaceholder}
                {...form.register("description")}
              />
            </div>

          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
            {t.common.cancel}
          </Button>
          <Button
            variant="accent"
            type="submit"
            size="lg"
            className="font-bold px-8"
            disabled={createRequest.isPending}
          >
            {createRequest.isPending ? m.submitting : m.submit}
          </Button>
        </div>
      </form>
      </div>
    </>
  );
}
