import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shown next to provider links and comparison results, not only in the footer. */
export function AffiliateDisclosure({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-xs text-muted-foreground", className)}>
      <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        GPUDealer may earn a commission when you sign up or purchase through certain provider links. This doesn&apos;t
        affect the price you pay, and it never affects how providers are ordered or compared.
      </span>
    </p>
  );
}
