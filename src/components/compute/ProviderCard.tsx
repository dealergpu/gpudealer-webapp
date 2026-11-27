import { Link } from "@/i18n/navigation";
import { getI18n } from "@/i18n/server";
import type { ComputeProvider } from "@/lib/api";
import { ProviderLogo } from "@/components/compute/ProviderLogo";
import { FeaturedBadge } from "@/components/compute/FeaturedBadge";

/** Directory card linking to a provider's page. Used on /compute and /compute/providers. */
export async function ProviderCard({ provider }: { provider: ComputeProvider }) {
  const { t } = await getI18n();
  return (
    <Link
      href={`/compute/providers/${provider.slug}`}
      className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/25"
    >
      <div className="flex items-center gap-3">
        <ProviderLogo provider={provider} />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {provider.name}
            <FeaturedBadge provider={provider} />
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {provider.providerTypes.map((type) => t.computeLabels.providerTypes[type]).join(" · ")}
          </p>
        </div>
      </div>
      {provider.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{provider.description}</p>}
      <p className="mt-auto pt-3 text-xs text-muted-foreground">
        {provider.offeringCount > 0
          ? `${provider.offeringCount} ${provider.offeringCount === 1 ? t.computeUi.offeringOne : t.computeUi.offeringMany}`
          : t.computeUi.noPrices}
      </p>
    </Link>
  );
}
