import { cn } from "@/lib/utils";

/**
 * "Featured" pill next to a provider's name. Reads the API's `isFeatured`
 * flag only — never a hardcoded list — and treats a missing flag as false.
 * It's the only difference featuring makes: lists keep the API's order.
 */
export function FeaturedBadge({ provider, className }: { provider: { isFeatured?: boolean | null }; className?: string }) {
  if (provider.isFeatured !== true) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-accent px-2 py-px text-[10px] font-medium leading-4 text-accent-foreground",
        className,
      )}
    >
      Featured
    </span>
  );
}
