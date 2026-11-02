'use client';

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, Flag } from "lucide-react";
import { ListingReportReason, useGetMyProfile, useReportListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { signInPath } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const COMMENTS_MAX = 2000;
// Coming back from sign-in with this hash reopens the dialog.
const REPORT_HASH = "#report";

const REASONS: { value: ListingReportReason; label: string; hint: string }[] = [
  { value: ListingReportReason.WRONG_SPECS, label: "Wrong specifications", hint: "Model, VRAM or other specs don't match the hardware." },
  { value: ListingReportReason.MISLEADING_CLAIMS, label: "Misleading claims", hint: "Condition, testing or warranty claims look false." },
  { value: ListingReportReason.LISTING_NOT_AVAILABLE, label: "No longer available", hint: "Already sold, or the seller says it's gone." },
  { value: ListingReportReason.WRONG_IMAGES, label: "Wrong or stolen images", hint: "Photos don't show the actual item." },
  { value: ListingReportReason.WRONG_PRICE, label: "Wrong price", hint: "The price is incorrect or a bait price." },
  { value: ListingReportReason.SUSPECTED_SCAM, label: "Suspected scam", hint: "Unusual payment requests or too good to be true." },
  { value: ListingReportReason.DUPLICATE_LISTING, label: "Duplicate listing", hint: "The same item is listed more than once." },
  { value: ListingReportReason.PROHIBITED_ITEM, label: "Prohibited item", hint: "Stolen, counterfeit or not allowed on GPUDealer." },
  { value: ListingReportReason.OTHER, label: "Something else", hint: "Tell us what's wrong below." },
];

/**
 * Shown to everyone. Signed-out visitors are sent to sign in and brought
 * back with the dialog open. Hidden for the listing's own seller (the API
 * refuses self-reports).
 */
export function ReportListingButton({ listingId, listingPath, sellerId }: {
  listingId: string;
  listingPath: string;
  sellerId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user } = useAuth();
  // sellerId is a backend user id — compare against /me, not the Supabase id.
  const { data: me } = useGetMyProfile({ query: { enabled: !!user } });
  const reportListing = useReportListing();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ListingReportReason | "">("");
  const [comments, setComments] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; comments?: string; form?: string }>({});
  const [reported, setReported] = useState(false);

  const returnTo = `${listingPath}${REPORT_HASH}`;

  useEffect(() => {
    if (!user || window.location.hash !== REPORT_HASH) return;
    // Opening on return from sign-in reads the URL, which only exists after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [user]);

  if (user && me?.data.id === sellerId) return null;

  const trimmed = comments.trim();
  const commentsRequired = reason === ListingReportReason.OTHER;

  const handleOpen = () => {
    if (!user) {
      router.push(signInPath(returnTo));
      return;
    }
    setOpen(true);
  };

  const submit = () => {
    const next: typeof errors = {};
    if (!reason) next.reason = "Choose a reason.";
    if (commentsRequired && !trimmed) next.comments = "Tell us what's wrong.";
    if (trimmed.length > COMMENTS_MAX) next.comments = `Keep it under ${COMMENTS_MAX} characters.`;
    setErrors(next);
    if (!reason || Object.keys(next).length > 0) return;

    reportListing.mutate(
      { listingId, data: { reason, ...(trimmed ? { additionalComments: trimmed } : {}) } },
      {
        onSuccess: () => setReported(true),
        onError: (error) => {
          const message = error.data?.error?.message;
          switch (error.status) {
            case 400: {
              const fields = error.data?.error?.fields as Record<string, unknown> | undefined;
              setErrors({
                reason: typeof fields?.reason === "string" ? fields.reason : undefined,
                comments: typeof fields?.additionalComments === "string" ? fields.additionalComments : undefined,
                form: fields ? undefined : message,
              });
              return;
            }
            case 401:
              toast({ title: "Please log in again", description: "Your session has expired." });
              router.push(signInPath(`${pathname}${REPORT_HASH}`));
              return;
            case 409:
              // Already have an open report — same outcome for the user.
              setReported(true);
              return;
            case 403:
            case 404:
              setErrors({ form: message ?? "This listing can't be reported." });
              return;
            case 429:
              setErrors({ form: "You're sending reports too fast, try again in a minute." });
              return;
            default:
              setErrors({ form: "Something went wrong. Please try again." });
          }
        },
      },
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (reportListing.isPending) return;
    setOpen(next);
    if (!next && !reported) setErrors({});
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground hover:text-destructive"
        onClick={handleOpen}
        disabled={reported}
      >
        <Flag className="mr-2 h-4 w-4" />
        {reported ? "Listing reported" : "Report listing"}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        {/* Header and footer stay put; only the reason list scrolls. */}
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          {reported ? (
            <div className="p-6 py-10 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" aria-hidden />
              <DialogTitle className="mb-2">Thanks — we&apos;ve got your report</DialogTitle>
              <DialogDescription>
                Our team reviews every report and takes the listing down if it breaks the rules.
              </DialogDescription>
              <Button className="mt-6" onClick={() => setOpen(false)}>Done</Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              noValidate
              className="flex min-h-0 flex-1 flex-col"
            >
              <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6 pr-12">
                <DialogTitle>Report this listing</DialogTitle>
                <DialogDescription>
                  What&apos;s wrong with it? Reports are private — the seller won&apos;t see who sent them.
                </DialogDescription>
              </DialogHeader>

              {/* A div, not a fieldset: fieldsets have a min-content minimum
                  size, so they can't shrink inside the flex column and scroll. */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                <RadioGroup
                  aria-label="Reason"
                  value={reason}
                  onValueChange={(value) => {
                    setReason(value as ListingReportReason);
                    setErrors((prev) => ({ ...prev, reason: undefined, comments: undefined }));
                  }}
                  className="gap-1.5"
                  aria-invalid={!!errors.reason}
                >
                  {REASONS.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`report-${option.value}`}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 font-normal transition-colors hover:bg-muted/50",
                        reason === option.value && "border-foreground/40 bg-muted/60",
                      )}
                    >
                      <RadioGroupItem id={`report-${option.value}`} value={option.value} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="block text-xs text-muted-foreground">{option.hint}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
                {errors.reason && <p className="mt-2 text-sm text-destructive" role="alert">{errors.reason}</p>}
              </div>

              <div className="shrink-0 space-y-2 border-t border-border bg-background px-6 pb-6 pt-4">
                <Label htmlFor="report-comments">
                  Details {commentsRequired ? <span className="text-destructive">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
                </Label>
                <Textarea
                  id="report-comments"
                  rows={2}
                  value={comments}
                  onChange={(e) => {
                    setComments(e.target.value);
                    if (errors.comments) setErrors((prev) => ({ ...prev, comments: undefined }));
                  }}
                  placeholder="e.g. Listed as 24GB, but GPU-Z shows 12GB"
                  aria-invalid={!!errors.comments}
                />
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-destructive" role={errors.comments ? "alert" : undefined}>{errors.comments}</span>
                  <span className={cn("tabular-nums text-muted-foreground", trimmed.length > COMMENTS_MAX && "text-destructive")}>
                    {trimmed.length}/{COMMENTS_MAX}
                  </span>
                </div>

                {errors.form && (
                  <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{errors.form}</p>
                )}

                <DialogFooter className="mt-4 gap-2">
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={reportListing.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={reportListing.isPending}>
                    {reportListing.isPending && <Spinner className="mr-1.5" />}
                    Submit report
                  </Button>
                </DialogFooter>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
