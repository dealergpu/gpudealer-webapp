import { cn } from "@/lib/utils";
import { getI18n } from "@/i18n/server";

/**
 * "Featured" pill next to a provider's name. Reads the API's `isFeatured`
 * flag only — never a hardcoded list — and treats a missing flag as false.
 * Featured providers are also shown first (see `getFeaturedProviders`).
 */
export async function FeaturedBadge({ provider, className }: { provider: { isFeatured?: boolean | null }; className?: string }) {
  if (provider.isFeatured !== true) return null;
  const { t } = await getI18n();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-accent px-2 py-px text-[10px] font-medium leading-4 text-accent-foreground",
        className,
      )}
    >
      {t.computeUi.featured}
    </span>
  );
}
