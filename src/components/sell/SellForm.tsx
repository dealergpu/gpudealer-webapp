'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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

const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  category: z.nativeEnum(ListingCategory),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  gpuModel: z.string().optional(),
  vramGb: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1").default(1),
  condition: z.nativeEnum(ListingCondition),
  price: z.coerce.number().min(1, "Price must be at least $1"),
  currency: z.string().default("USD"),
  locationCountry: z.string().optional(),
  locationRegion: z.string().optional(),
  locationCity: z.string().optional(),
  imageUrl: z.string().url("Enter a valid URL").optional().or(z.literal("").transform(() => undefined)),
  description: z.string().optional(),
});

type ListingFormValues = z.infer<typeof listingSchema>;

export function SellForm() {
  const router = useRouter();
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
        onSuccess: (response) => {
          queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
          toast({
            title: "Listing Created",
            description: "Your hardware has been saved as a draft. Submit it for review from your dashboard to publish it.",
          });
          router.push(`/listing/${response.data.id}`);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create listing. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const currentCategory = form.watch("category");

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-heading">List Hardware for Sale</h1>
        <p className="text-muted-foreground mt-2">Provide accurate details to reach verified buyers faster.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-border shadow-sm mb-6">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details for your listing.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold">Listing Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. 8x NVIDIA H100 80GB SXM5 - Data Center Pull"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="font-semibold">Category <span className="text-destructive">*</span></Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(val) => form.setValue("category", val as ListingCategory)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ListingCategory.GPU}>GPU</SelectItem>
                    <SelectItem value={ListingCategory.SERVER}>Server / Rack</SelectItem>
                    <SelectItem value={ListingCategory.MEMORY}>Memory / Storage</SelectItem>
                    <SelectItem value={ListingCategory.OTHER}>Other Components</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition" className="font-semibold">Condition <span className="text-destructive">*</span></Label>
                <Select
                  value={form.watch("condition")}
                  onValueChange={(val) => form.setValue("condition", val as ListingCondition)}
                >
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ListingCondition.NEW}>New (Sealed)</SelectItem>
                    <SelectItem value={ListingCondition.USED}>Used (Working)</SelectItem>
                    <SelectItem value={ListingCondition.REFURBISHED}>Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="font-semibold">Asking Price (USD) <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="quantity" className="font-semibold">Quantity Available <span className="text-destructive">*</span></Label>
                <Input
                  id="quantity"
                  type="number"
                  {...form.register("quantity")}
                />
              </div>
            </div>

          </CardContent>
        </Card>

        <Card className="border-border shadow-sm mb-8">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>Technical Specs & Details</CardTitle>
            <CardDescription>Detailed specs help buyers verify compatibility.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  placeholder="e.g. NVIDIA, AMD, Supermicro"
                  {...form.register("manufacturer")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Specific Model</Label>
                <Input
                  id="model"
                  placeholder="e.g. RTX 4090 Founders Edition"
                  {...form.register("model")}
                />
              </div>

              {currentCategory === ListingCategory.GPU && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gpuModel">GPU Model</Label>
                    <Input
                      id="gpuModel"
                      placeholder="e.g. RTX 4090"
                      {...form.register("gpuModel")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vramGb">VRAM per GPU (GB)</Label>
                    <Input
                      id="vramGb"
                      type="number"
                      placeholder="e.g. 24"
                      {...form.register("vramGb")}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></Label>
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
                <Label htmlFor="locationCity">City <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></Label>
                <Input
                  id="locationCity"
                  placeholder="e.g. San Jose"
                  {...form.register("locationCity")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationRegion">State / Region <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></Label>
                <Input
                  id="locationRegion"
                  placeholder="e.g. California"
                  {...form.register("locationRegion")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationCountry">Country <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></Label>
                <Input
                  id="locationCountry"
                  placeholder="e.g. USA"
                  {...form.register("locationCountry")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder="Include details about usage history, warranty status, accessories included..."
                {...form.register("description")}
              />
            </div>

          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            className="bg-accent hover:bg-accent/90 text-white font-bold px-8"
            disabled={createListing.isPending}
          >
            {createListing.isPending ? "Saving..." : "Save Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
