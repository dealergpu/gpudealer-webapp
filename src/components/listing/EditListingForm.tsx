'use client';

import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  ListingCategory,
  ListingCondition,
  getGetListingQueryKey,
  getGetListingsQueryKey,
  useGetListing,
  useGetMyProfile,
  useUpdateListing,
  type Listing,
  type ListingUpdate,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createClientSafely } from "@/lib/supabase/client";
import { photoPathFromUrl, removeListingPhotos } from "@/lib/supabase/listing-photos";
import { PhotoManager, type PhotoItem } from "@/components/listing/PhotoManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { listingPath } from "@/lib/listing-path";

// All inputs are held as strings and converted on save, so "cleared" is
// simply "" and react-hook-form's dirty tracking works on raw input values.
const optionalInt = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d+$/.test(v), "Enter a whole number");

const editSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters"),
  description: z.string().max(10000, "Description is too long"),
  category: z.nativeEnum(ListingCategory),
  condition: z.nativeEnum(ListingCondition),
  manufacturer: z.string(),
  model: z.string(),
  gpuModel: z.string(),
  vramGb: optionalInt,
  quantity: z.string().trim().refine((v) => /^\d+$/.test(v) && Number(v) >= 1, "Quantity must be at least 1"),
  price: z.string().trim().refine((v) => v !== "" && Number(v) > 0, "Enter a price above 0"),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/, "Use a 3-letter code, e.g. USD"),
  locationCountry: z.string(),
  locationRegion: z.string(),
  locationCity: z.string(),
  cpuModel: z.string(),
  ramGb: optionalInt,
  storageGb: optionalInt,
  memoryType: z.string(),
  memorySpeed: optionalInt,
  memoryCapacityGb: optionalInt,
  ecc: z.enum(["", "yes", "no"]),
  formFactor: z.string(),
});

type EditValues = z.infer<typeof editSchema>;
type FieldName = keyof EditValues;

const TEXT_FIELDS = [
  "description", "manufacturer", "model", "gpuModel", "locationCountry",
  "locationRegion", "locationCity", "cpuModel", "memoryType", "formFactor",
] as const;
const INT_FIELDS = ["vramGb", "ramGb", "storageGb", "memorySpeed", "memoryCapacityGb"] as const;

function toFormValues(listing: Listing): EditValues {
  const str = (v: string | number | null | undefined) => (v == null ? "" : String(v));
  return {
    title: listing.title,
    description: str(listing.description),
    category: listing.category,
    condition: listing.condition,
    manufacturer: str(listing.manufacturer),
    model: str(listing.model),
    gpuModel: str(listing.gpuModel),
    vramGb: str(listing.vramGb),
    quantity: str(listing.quantity ?? 1),
    price: str(listing.price),
    currency: listing.currency,
    locationCountry: str(listing.locationCountry),
    locationRegion: str(listing.locationRegion),
    locationCity: str(listing.locationCity),
    cpuModel: str(listing.cpuModel),
    ramGb: str(listing.ramGb),
    storageGb: str(listing.storageGb),
    memoryType: str(listing.memoryType),
    memorySpeed: str(listing.memorySpeed),
    memoryCapacityGb: str(listing.memoryCapacityGb),
    ecc: listing.ecc == null ? "" : listing.ecc ? "yes" : "no",
    formFactor: str(listing.formFactor),
  };
}

/** Builds the PATCH body from only the fields the user actually changed. */
function toUpdateBody(values: EditValues, dirty: Partial<Record<FieldName, boolean>>): ListingUpdate {
  const body: ListingUpdate = {};
  const isDirty = (name: FieldName) => dirty[name] === true;

  if (isDirty("title")) body.title = values.title.trim();
  if (isDirty("category")) body.category = values.category;
  if (isDirty("condition")) body.condition = values.condition;
  if (isDirty("quantity")) body.quantity = Number(values.quantity);
  if (isDirty("price")) body.price = Number(values.price);
  if (isDirty("currency")) body.currency = values.currency.trim().toUpperCase();
  if (isDirty("ecc")) body.ecc = values.ecc === "" ? null : values.ecc === "yes";
  for (const name of TEXT_FIELDS) {
    if (isDirty(name)) body[name] = values[name].trim() || null;
  }
  for (const name of INT_FIELDS) {
    if (isDirty(name)) body[name] = values[name].trim() === "" ? null : Number(values[name]);
  }
  return body;
}

function toPhotoItems(listing: Listing): PhotoItem[] {
  return [...(listing.images ?? [])]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((image) => ({
      key: image.id ?? crypto.randomUUID(),
      url: image.url,
      altText: image.altText ?? "",
      status: "ready" as const,
    }));
}

const photosSignature = (photos: PhotoItem[]) =>
  JSON.stringify(photos.map((p) => [p.url, p.altText.trim()]));

/** `error.fields` values may be a message or a list of messages. */
function fieldMessage(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(" ");
  return typeof value === "string" ? value : "Invalid value";
}

export function EditListingForm({ listingId }: { listingId: string }) {
  const listingQuery = useGetListing(listingId);
  const profileQuery = useGetMyProfile();

  if (listingQuery.isLoading || profileQuery.isLoading) {
    return <PageShell><p className="text-muted-foreground">Loading listing...</p></PageShell>;
  }

  if (listingQuery.error?.status === 404) {
    return (
      <PageShell>
        <Notice title="Listing not found" body="This listing doesn't exist or has been removed." />
      </PageShell>
    );
  }

  if (listingQuery.isError || profileQuery.isError || !listingQuery.data || !profileQuery.data) {
    return (
      <PageShell>
        <Notice title="Couldn't load this listing" body="Something went wrong. Please refresh the page to try again." />
      </PageShell>
    );
  }

  const listing = listingQuery.data.data;
  if (listing.sellerId !== profileQuery.data.data.id) {
    return (
      <PageShell>
        <Notice title="You can't edit this listing" body="Only the seller who created a listing can edit it." />
      </PageShell>
    );
  }

  // Keyed by listing so the form re-initialises if the listing changes.
  return <EditListingFields key={listing.id} listing={listing} />;
}

function EditListingFields({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [supabase] = useState(createClientSafely);
  const updateListing = useUpdateListing();

  const [photos, setPhotos] = useState<PhotoItem[]>(() => toPhotoItems(listing));
  const [initialPhotos] = useState(() => photos);
  // Storage paths uploaded during this edit session, for cleanup.
  const sessionUploads = useRef<string[]>([]);

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: toFormValues(listing),
  });
  const category = useWatch({ control: form.control, name: "category" });
  const condition = useWatch({ control: form.control, name: "condition" });
  const ecc = useWatch({ control: form.control, name: "ecc" });
  const { errors, dirtyFields } = form.formState;

  const photosChanged = photosSignature(photos) !== photosSignature(initialPhotos);
  const photosBusy = photos.some((p) => p.status === "uploading");
  const photosFailed = photos.some((p) => p.status === "error");

  const handleCancel = () => {
    if (supabase) void removeListingPhotos(supabase, sessionUploads.current);
    router.push("/dashboard");
  };

  const applyServerErrors = (error: ApiError) => {
    const fields = (error.data as { error?: { fields?: Record<string, unknown> } } | null)?.error?.fields;
    if (!fields) return false;
    for (const [key, value] of Object.entries(fields)) {
      const imageMatch = /^images\.(\d+)/.exec(key);
      if (imageMatch) {
        const index = Number(imageMatch[1]);
        setPhotos((prev) =>
          prev.map((p, i) => (i === index ? { ...p, status: "error", error: fieldMessage(value) } : p)),
        );
      } else if (key in editSchema.shape) {
        form.setError(key as FieldName, { message: fieldMessage(value) });
      }
    }
    return true;
  };

  const onSubmit = (values: EditValues) => {
    if (photosBusy) {
      toast({ title: "Photos are still uploading", description: "Wait for uploads to finish, then save." });
      return;
    }
    if (photosFailed) {
      toast({
        title: "Some photos failed to upload",
        description: "Retry or remove them before saving.",
        variant: "destructive",
      });
      return;
    }

    const body = toUpdateBody(values, dirtyFields);
    if (photosChanged) {
      body.images = photos.map((p) => ({
        url: p.url!,
        ...(p.altText.trim() ? { altText: p.altText.trim() } : {}),
      }));
    }
    if (Object.keys(body).length === 0) {
      toast({ title: "No changes to save" });
      return;
    }

    updateListing.mutate(
      { id: listing.id, data: body },
      {
        onSuccess: (response) => {
          if (supabase && photosChanged) {
            const keptUrls = new Set(photos.map((p) => p.url));
            const removedOriginals = initialPhotos
              .filter((p) => p.url && !keptUrls.has(p.url))
              .map((p) => photoPathFromUrl(p.url!))
              // Only files in the user's own folder — anything else isn't theirs to delete.
              .filter((path): path is string => !!path && !!user && path.startsWith(`${user.id}/`));
            const discardedUploads = sessionUploads.current.filter(
              (path) => !photos.some((p) => p.url && photoPathFromUrl(p.url) === path),
            );
            void removeListingPhotos(supabase, [...removedOriginals, ...discardedUploads]);
          }
          queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(listing.id) });
          toast({ title: "Listing updated", description: "Your changes have been saved." });
          // The slug can change when a draft's title is edited, so always
          // navigate with the one the API just returned.
          router.push(listingPath(response.data));
          router.refresh();
        },
        onError: (error) => {
          if (error.status === 401) {
            toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
            router.push("/sign-in");
            return;
          }
          if (error.status === 403) {
            toast({ title: "You can't edit this listing", variant: "destructive" });
            return;
          }
          if (error.status === 404) {
            toast({ title: "Listing not found", description: "It may have been removed.", variant: "destructive" });
            return;
          }
          if (error.status === 400 && applyServerErrors(error)) {
            toast({ title: "Please fix the highlighted fields", variant: "destructive" });
            return;
          }
          toast({ title: "Couldn't save changes", description: "Please try again.", variant: "destructive" });
        },
      },
    );
  };

  const field = (name: FieldName, label: string, input: ReactNode, required = false) => (
    <div className="space-y-2">
      <Label htmlFor={name} className={required ? "font-semibold" : undefined}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {input}
      {errors[name] && <p className="text-sm text-destructive">{errors[name]?.message}</p>}
    </div>
  );

  const text = (name: FieldName, placeholder?: string, props: ComponentProps<typeof Input> = {}) => (
    <Input id={name} placeholder={placeholder} aria-invalid={!!errors[name]} {...props} {...form.register(name)} />
  );

  return (
    <PageShell
      title="Edit Listing"
      subtitle={listing.title}
    >
      <form onSubmit={(e) => form.handleSubmit(onSubmit)(e)} noValidate>
        <Card className="overflow-hidden border-border mb-6">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details for your listing.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {field("title", "Listing Title", text("title"), true)}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {field("category", "Category", (
                <Select
                  value={category}
                  onValueChange={(val) => form.setValue("category", val as ListingCategory, { shouldDirty: true })}
                >
                  <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ListingCategory.GPU}>GPU</SelectItem>
                    <SelectItem value={ListingCategory.SERVER}>Server / Rack</SelectItem>
                    <SelectItem value={ListingCategory.MEMORY}>Memory / Storage</SelectItem>
                    <SelectItem value={ListingCategory.OTHER}>Other Components</SelectItem>
                  </SelectContent>
                </Select>
              ), true)}

              {field("condition", "Condition", (
                <Select
                  value={condition}
                  onValueChange={(val) => form.setValue("condition", val as ListingCondition, { shouldDirty: true })}
                >
                  <SelectTrigger id="condition"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ListingCondition.NEW}>New (Sealed)</SelectItem>
                    <SelectItem value={ListingCondition.USED}>Used (Working)</SelectItem>
                    <SelectItem value={ListingCondition.REFURBISHED}>Refurbished</SelectItem>
                    <SelectItem value={ListingCondition.UNKNOWN}>Unknown</SelectItem>
                  </SelectContent>
                </Select>
              ), true)}

              <div className="grid grid-cols-[1fr_6rem] gap-3">
                {field("price", "Price per Unit", text("price", "0.00", { inputMode: "decimal", className: "font-mono" }), true)}
                {field("currency", "Currency", text("currency", "USD", { maxLength: 3, className: "font-mono uppercase" }), true)}
              </div>

              {field("quantity", "Quantity Available", text("quantity", "1", { inputMode: "numeric" }), true)}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border mb-6">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>Technical Specs & Details</CardTitle>
            <CardDescription>Detailed specs help buyers verify compatibility.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {field("manufacturer", "Manufacturer", text("manufacturer", "e.g. NVIDIA, AMD, Supermicro"))}
              {field("model", "Specific Model", text("model", "e.g. RTX 4090 Founders Edition"))}

              {category === ListingCategory.GPU && (
                <>
                  {field("gpuModel", "GPU Model", text("gpuModel", "e.g. RTX 4090"))}
                  {field("vramGb", "VRAM per GPU (GB)", text("vramGb", "e.g. 24", { inputMode: "numeric" }))}
                </>
              )}

              {category === ListingCategory.SERVER && (
                <>
                  {field("cpuModel", "CPU", text("cpuModel", "e.g. 2x Xeon Gold 6338"))}
                  {field("ramGb", "RAM (GB)", text("ramGb", "e.g. 512", { inputMode: "numeric" }))}
                  {field("storageGb", "Storage (GB)", text("storageGb", "e.g. 7680", { inputMode: "numeric" }))}
                </>
              )}

              {category === ListingCategory.MEMORY && (
                <>
                  {field("memoryType", "Memory Type", text("memoryType", "e.g. DDR5 RDIMM"))}
                  {field("memoryCapacityGb", "Capacity per Module (GB)", text("memoryCapacityGb", "e.g. 64", { inputMode: "numeric" }))}
                  {field("memorySpeed", "Speed (MT/s)", text("memorySpeed", "e.g. 4800", { inputMode: "numeric" }))}
                  {field("formFactor", "Form Factor", text("formFactor", "e.g. RDIMM, LRDIMM, SO-DIMM"))}
                  {field("ecc", "ECC", (
                    <Select
                      value={ecc || "unset"}
                      onValueChange={(val) =>
                        form.setValue("ecc", val === "unset" ? "" : (val as "yes" | "no"), { shouldDirty: true })
                      }
                    >
                      <SelectTrigger id="ecc"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Not specified</SelectItem>
                        <SelectItem value="yes">ECC</SelectItem>
                        <SelectItem value="no">Non-ECC</SelectItem>
                      </SelectContent>
                    </Select>
                  ))}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {field("locationCity", "City", text("locationCity", "e.g. San Jose"))}
              {field("locationRegion", "State / Region", text("locationRegion", "e.g. California"))}
              {field("locationCountry", "Country", text("locationCountry", "e.g. USA"))}
            </div>

            {field("description", "Description", (
              <Textarea
                id="description"
                className="min-h-[120px] resize-y"
                placeholder="Include details about usage history, warranty status, accessories included..."
                aria-invalid={!!errors.description}
                {...form.register("description")}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border mb-8">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <CardTitle>Photos</CardTitle>
            <CardDescription>Photos upload right away; the listing only changes when you save.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {supabase && user ? (
              <PhotoManager
                photos={photos}
                setPhotos={setPhotos}
                supabase={supabase}
                supabaseUserId={user.id}
                listingId={listing.id}
                onUploaded={(path) => sessionUploads.current.push(path)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Photo uploads are unavailable right now.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            size="lg"
            className="font-bold px-8"
            disabled={updateListing.isPending || photosBusy}
          >
            {updateListing.isPending ? "Saving..." : photosBusy ? "Uploading photos..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}

function PageShell({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  return (
    <>
      <PageHeader eyebrow="Edit listing" title={title ?? "Listing"} description={subtitle} />
      <div className="container mx-auto max-w-3xl px-4 py-12">{children}</div>
    </>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-12 text-center">
        <h1 className="text-lg font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6">{body}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
