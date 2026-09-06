'use client';

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Search } from "lucide-react";

const requestSchema = z.object({
  title: z.string().min(5, "Give your request a short title"),
  category: z.nativeEnum(ListingCategory),
  requestedModel: z.string().min(3, "Model requirement is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  minVramGb: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  maxBudgetPerUnit: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  conditionPreference: z.nativeEnum(ListingCondition),
  destinationCountry: z.string().optional(),
  destinationCity: z.string().optional(),
  description: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export function RequestFormClient() {
  const router = useRouter();
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

  const onSubmit = (data: RequestFormValues) => {
    createRequest.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey() });
          toast({
            title: "Request Submitted",
            description: "Your hardware request is now open. We'll reach out if we find a match.",
          });
          router.push("/dashboard");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to submit request. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8 flex items-start gap-4">
        <div className="h-12 w-12 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
          <Search className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading tracking-tight">Post a Hardware Request</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Can't find exact specs on the marketplace? Broadcast your needs directly to our network of professional resellers and data centers.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-border shadow-sm mb-8">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>Requirements</CardTitle>
            <CardDescription>Be specific to attract the right suppliers.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold">Request Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Need 50x RTX 4090 for training cluster"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedModel" className="font-semibold">Target Model / Specs <span className="text-destructive">*</span></Label>
              <Input
                id="requestedModel"
                placeholder="e.g. 8x NVIDIA H100 80GB SXM5, or equivalent"
                {...form.register("requestedModel")}
              />
              {form.formState.errors.requestedModel && (
                <p className="text-sm text-destructive">{form.formState.errors.requestedModel.message}</p>
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
                <Label htmlFor="quantity" className="font-semibold">Quantity Needed <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="minVramGb">Minimum VRAM (GB) <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></Label>
                <Input
                  id="minVramGb"
                  type="number"
                  placeholder="e.g. 24"
                  {...form.register("minVramGb")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditionPreference" className="font-semibold">Condition Preference <span className="text-destructive">*</span></Label>
                <Select
                  value={form.watch("conditionPreference")}
                  onValueChange={(val) => form.setValue("conditionPreference", val as ListingCondition)}
                >
                  <SelectTrigger id="conditionPreference">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ListingCondition.UNKNOWN}>No Preference</SelectItem>
                    <SelectItem value={ListingCondition.NEW}>New Only</SelectItem>
                    <SelectItem value={ListingCondition.USED}>Used Acceptable</SelectItem>
                    <SelectItem value={ListingCondition.REFURBISHED}>Refurbished Acceptable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CardContent>
        </Card>

        <Card className="border-border shadow-sm mb-8">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>Logistics & Budget</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maxBudgetPerUnit">Target Budget per Unit (USD) <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></Label>
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
                <Label htmlFor="destinationCity">Destination City <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></Label>
                <Input
                  id="destinationCity"
                  placeholder="e.g. Bangalore"
                  {...form.register("destinationCity")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="destinationCountry">Destination Country <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></Label>
                <Input
                  id="destinationCountry"
                  placeholder="e.g. India"
                  {...form.register("destinationCountry")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Notes</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder="Specific networking requirements, timeline, alternative models considered..."
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
            disabled={createRequest.isPending}
          >
            {createRequest.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
