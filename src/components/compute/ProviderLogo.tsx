import type { ComputeProviderSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

/** Provider logo, or its initials while the directory has no logos. */
export function ProviderLogo({
  provider,
  className,
}: {
  provider: Pick<ComputeProviderSummary, "name" | "logoUrl">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {provider.logoUrl ? (
        <img src={provider.logoUrl} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        <span aria-hidden className="font-mono text-[0.7rem] font-semibold">{initials(provider.name)}</span>
      )}
    </span>
  );
}
