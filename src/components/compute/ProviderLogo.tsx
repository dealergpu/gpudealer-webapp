import type { ComputeProviderSummary } from "@/lib/api";
import { providerLogoSrc } from "@/lib/compute";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

/**
 * Provider logo, or its initials when there's none. `icon` (default) is the
 * square mark on white; `full` is the wordmark on the brand colour, for
 * large tiles only.
 */
export function ProviderLogo({
  provider,
  variant = "icon",
  className,
}: {
  provider: Pick<ComputeProviderSummary, "name" | "slug" | "logoUrl">;
  variant?: "icon" | "full";
  className?: string;
}) {
  const src = providerLogoSrc(provider, variant);
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border text-muted-foreground",
        src ? "bg-white" : "bg-muted",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className={cn("h-full w-full", variant === "full" ? "object-cover" : "object-contain p-1")}
        />
      ) : (
        <span aria-hidden className="font-mono text-[0.7rem] font-semibold">{initials(provider.name)}</span>
      )}
    </span>
  );
}
