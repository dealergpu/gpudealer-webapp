'use client';

import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSaveToggle } from "@/lib/saved-listings";
import { cn } from "@/lib/utils";

/**
 * Save/unsave toggle. `icon` is the round overlay on listing cards; `full`
 * is the wide button on the listing details page.
 */
export function SaveListingButton({
  listingId,
  variant = "icon",
  className,
}: {
  listingId: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { isSaved, toggle, isBusy } = useSaveToggle(listingId);
  const label = isSaved ? "Remove from saved" : "Save listing";
  const icon = <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} aria-hidden />;

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn("h-12 w-full border-border text-base font-semibold", className)}
        onClick={toggle}
        disabled={isBusy}
        aria-pressed={isSaved}
      >
        {icon}
        <span className="ml-2">{isSaved ? "Saved" : "Save Listing"}</span>
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isBusy}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait",
        isSaved && "text-accent",
        className,
      )}
    >
      {icon}
    </button>
  );
}
