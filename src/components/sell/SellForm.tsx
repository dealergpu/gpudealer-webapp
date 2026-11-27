'use client';

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateListing, ListingCategory, ListingCondition, getGetListingsQueryKey } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/layout/PageHeader";

const makeListingSchema = (m: Messages["sell"]) => z.object({
  title: z.string().min(5, m.titleMin),
  category: z.nativeEnum(ListingCategory),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  gpuModel: z.string().optional(),
  vramGb: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  quantity: z.coerce.number().min(1, m.quantityMin).default(1),
  condition: z.nativeEnum(ListingCondition),
  price: z.coerce.number().min(1, m.priceMin),
  currency: z.string().default("USD"),
  locationCountry: z.string().optional(),
  locationRegion: z.string().optional(),
  locationCity: z.string().optional(),
  imageUrl: z.string().url(m.urlInvalid).optional().or(z.literal("").transform(() => undefined)),
  description: z.string().optional(),
});

type ListingFormValues = z.infer<ReturnType<typeof makeListingSchema>>;

export function SellForm() {
  const router = useRouter();
  const { t } = useI18n();
  const m = t.sell;
  const [listingSchema] = useState(() => makeListingSchema(m));
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createListing = useCreateListing();

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      category: ListingCategory.GPU,
      condition: ListingCondition.USED,
      quantity: 1,
      currency: "USD",
    },
  });
  const currentCategory = useWatch({ control: form.control, name: "category" });
  const condition = useWatch({ control: form.control, name: "condition" });

  const onSubmit = (data: ListingFormValues) => {
    const { imageUrl, ...rest } = data;
    createListing.mutate(
      {
        data: {
          ...rest,
          images: imageUrl ? [{ url: imageUrl, sortOrder: 0 }] : undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
          toast({
            title: m.createdTitle,
            description: m.createdBody,
          });
          // New listings start as DRAFT, which the public (unauthenticated,
          // server-rendered) detail page can't see — send the seller to
          // their dashboard, where drafts are listed and can be submitted.
          router.push("/dashboard");
        },
        onError: () => {
          toast({
            title: m.errorTitle,
            description: m.createFailed,
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
        <Card className="overflow-hidden border-border mb-6">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>{m.basicInfo}</CardTitle>
            <CardDescription>{m.basicInfoDescription}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold">{m.listingTitle} <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder={m.listingTitlePlaceholder}
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="font-semibold">{m.category} <span className="text-destructive">*</span></Label>
                <Select
                  value={currentCategory}
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
                <Label htmlFor="condition" className="font-semibold">{m.condition} <span className="text-destructive">*</span></Label>
                <Select
                  value={condition}
                  onValueChange={(val) => form.setValue("condition", val as ListingCondition)}
                >
                  <SelectTrigger id="condition">
                    <SelectValue placeholder={m.conditionPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ListingCondition.NEW}>{m.conditionNew}</SelectItem>
                    <SelectItem value={ListingCondition.USED}>{m.conditionUsed}</SelectItem>
                    <SelectItem value={ListingCondition.REFURBISHED}>{m.conditionRefurbished}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="font-semibold">{m.askingPrice} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="price"
                    type="number"
                    className="pl-7 font-mono"
                    placeholder="0.00"
                    {...form.register("price")}
                  />
                </div>
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="font-semibold">{m.quantity} <span className="text-destructive">*</span></Label>
                <Input
                  id="quantity"
                  type="number"
                  {...form.register("quantity")}
                />
              </div>
            </div>

          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border mb-8">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>{m.specs}</CardTitle>
            <CardDescription>{m.specsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">{m.manufacturer}</Label>
                <Input
                  id="manufacturer"
                  placeholder={m.manufacturerPlaceholder}
                  {...form.register("manufacturer")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">{m.model}</Label>
                <Input
                  id="model"
                  placeholder={m.modelPlaceholder}
                  {...form.register("model")}
                />
              </div>

              {currentCategory === ListingCategory.GPU && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gpuModel">{m.gpuModel}</Label>
                    <Input
                      id="gpuModel"
                      placeholder={m.gpuModelPlaceholder}
                      {...form.register("gpuModel")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vramGb">{m.vram}</Label>
                    <Input
                      id="vramGb"
                      type="number"
                      placeholder={m.vramPlaceholder}
                      {...form.register("vramGb")}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="imageUrl">{m.imageUrl} <span className="text-muted-foreground font-normal text-xs ml-1">{t.common.optional}</span></Label>
                <Input
                  id="imageUrl"
                  placeholder="https://..."
                  {...form.register("imageUrl")}
                />
                {form.formState.errors.imageUrl && (
                  <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="locationCity">{m.city} <span className="text-muted-foreground font-normal text-xs ml-1">{t.common.optional}</span></Label>
                <Input
                  id="locationCity"
                  placeholder={m.cityPlaceholder}
                  {...form.register("locationCity")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationRegion">{m.region} <span className="text-muted-foreground font-normal text-xs ml-1">{t.common.optional}</span></Label>
                <Input
                  id="locationRegion"
                  placeholder={m.regionPlaceholder}
                  {...form.register("locationRegion")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationCountry">{m.country} <span className="text-muted-foreground font-normal text-xs ml-1">{t.common.optional}</span></Label>
                <Input
                  id="locationCountry"
                  placeholder={m.countryPlaceholder}
                  {...form.register("locationCountry")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{m.descriptionLabel}</Label>
              <textarea
                id="description"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder={m.descriptionPlaceholder}
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
            disabled={createListing.isPending}
          >
            {createListing.isPending ? m.saving : m.save}
          </Button>
        </div>
      </form>
      </div>
    </>
  );
}
