import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

/** Shown next to provider links and comparison results, not only in the footer. */
export async function AffiliateDisclosure({ className }: { className?: string }) {
  const { t } = await getI18n();
  return (
    <p className={cn("flex items-start gap-2 text-xs text-muted-foreground", className)}>
      <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{t.computeUi.disclosure}</span>
    </p>
  );
}
