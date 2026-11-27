import { ArrowUpRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { providerVisitUrl } from "@/lib/compute";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";

/**
 * "Visit {provider}" — a plain link through the API's tracked redirect
 * (never the provider's URL directly). `source` says where the click came
 * from, e.g. `pricing-table`. `rel="sponsored"` because some of these links
 * carry referral tracking.
 */
export async function ProviderCTA({
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
  const { t } = await getI18n();
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a
        href={providerVisitUrl(provider.slug, { offering: offeringId, source })}
        target="_blank"
        rel="noopener sponsored"
      >
        {label ?? fmt(t.computeUi.visit, { provider: provider.name })}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{t.computeUi.opensNewTab}</span>
      </a>
    </Button>
  );
}
