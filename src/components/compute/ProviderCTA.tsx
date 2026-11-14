import { ArrowUpRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { providerVisitUrl } from "@/lib/compute";

/**
 * "Visit {provider}" — a plain link through the API's tracked redirect
 * (never the provider's URL directly). `source` says where the click came
 * from, e.g. `pricing-table`. `rel="sponsored"` because some of these links
 * carry referral tracking.
 */
export function ProviderCTA({
  provider,
  offeringId,
  source,
  label,
  variant = "outline",
  size = "sm",
  className,
}: {
  provider: { slug: string; name: string };
  offeringId?: string;
  source: string;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a
        href={providerVisitUrl(provider.slug, { offering: offeringId, source })}
        target="_blank"
        rel="noopener sponsored"
      >
        {label ?? `Visit ${provider.name}`}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </Button>
  );
}
